import os
import requests
import json
import sys
from pdf2image import convert_from_path, pdfinfo_from_path
import numpy as np
from PIL import Image
import base64
import tempfile
import re
import argparse

# --- Configuration Loading ---
def load_config(config_path=None):
    if config_path is None:
        # Default path relative to script location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(script_dir, "conf", "ocr.json")

    if not os.path.exists(config_path):
        raise FileNotFoundError(f"Configuration file not found at {config_path}")

    with open(config_path, 'r') as f:
        config = json.load(f)
    return config

# --- Constants and Globals (now derived from config) ---
# These will be initialized after config is loaded in main()
config = {}

# --- Helper Functions ---
def encode_image_to_base64(image_np):
    """Encodes a numpy array image to base64."""
    import io
    img_pil = Image.fromarray(image_np)
    buffered = io.BytesIO()
    img_pil.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode("utf-8")

def decode_and_save_base64_image(base64_string, output_path):
    """Decodes a base64 string to an image and saves it to the specified path."""
    try:
        img_data = base64.b64decode(base64_string)
        with open(output_path, 'wb') as f:
            f.write(img_data)
        return True
    except Exception as e:
        print(f"Warning: Failed to decode and save base64 image to {output_path}: {e}")
        return False

def clean_with_ollama(config, text_content=None):
    messages = []

    messages.append({"role": "user", "content": config['prompts']['text_cleanup_prompt'] + f'```markdown\n{text_content}\n```'})

    payload = {
        "model": config['llm_model_name'],
        "messages": messages,
        "stream": False
    }

    response = requests.post(config['ollama_url'], json=payload)
    response.raise_for_status()
    return response.json()["message"]["content"]

def call_ocr_endpoint(image_base64):
    """Sends base64 image to OCR endpoint and returns raw JSON response."""
    global config # Access the global config dictionary
    headers = {'Content-Type': 'application/json'}
    payload = {
        "file": image_base64,
        "fileType": 1,
        "useFormulaRecognition": False,
        "useTableRecognition": True,
        "useSealRecognition": False,
        "useChartRecognition": True,
        "useDocPreprocessing": True
    }
    response = requests.post(config['ocr_endpoint_url'] + "/layout-parsing", headers=headers, json=payload)
    response.raise_for_status()

    return response.json()

def process_ocr_blocks(raw_ocr_data):
    """Processes OCR results, orders text blocks by columns, and returns spatially ordered raw text."""
    parsing_res_list = raw_ocr_data.get('parsing_res_list', [])

    if not parsing_res_list:
        return ""

    # 1. Collect all text-like blocks with their coordinates
    text_blocks_with_coords = []
    for block_info in parsing_res_list:
        block_label = block_info.get('block_label')
        block_text = block_info.get('block_content', '')
        block_bbox = block_info.get('block_bbox', [0,0,0,0])

        # Exclude 'aside_text' and number blocks that are likely page numbers (far left or far right)
        if block_label == 'number':
            x1, _, x2, _ = block_bbox
            page_width_threshold = 600 # Heuristic: numbers beyond this x1 are likely page numbers
            page_left_threshold = 50 # Heuristic: numbers before this x2 are likely page numbers (if on left side)
            if x1 > page_width_threshold or x2 < page_left_threshold:
                continue # Skip this block if it's a side page number

        if block_label in ['text', 'paragraph_title', 'figure_title', 'list_item', 'table', 'number']:
            if block_bbox and len(block_bbox) == 4:
                x1, y1, x2, y2 = block_bbox
                text_blocks_with_coords.append({
                    'text': block_text,
                    'x1': x1,
                    'y1': y1,
                    'x2': x2,
                    'y2': y2,
                    'label': block_label
                })

    if not text_blocks_with_coords:
        return ""

    # 2. Dynamically determine column boundaries based on x-coordinates of all blocks
    # Collect all x1 coordinates to identify natural clusters, which represent column starts.
    x1_coords = [b['x1'] for b in text_blocks_with_coords]
    if not x1_coords:
        return ""

    # Sort x1 coordinates to make clustering easier
    x1_coords.sort()

    # Simple clustering: identify significant gaps between sorted x1 coordinates.
    # A "significant gap" indicates a new column.
    # The threshold for a gap will depend on the OCR output resolution and typical column spacing.
    # A value of 50-70 pixels might be a good starting point for a visual column break.
    # Let's use 50 as a balance between separating columns and grouping slightly indented text.
    gap_threshold = 50 

    column_x_clusters = []
    if x1_coords:
        current_cluster = [x1_coords[0]]
        for i in range(1, len(x1_coords)):
            if x1_coords[i] - current_cluster[-1] > gap_threshold:
                # End of current cluster, start a new one
                column_x_clusters.append(current_cluster)
                current_cluster = [x1_coords[i]]
            else:
                current_cluster.append(x1_coords[i])
        column_x_clusters.append(current_cluster) # Add the last cluster

    # Now, define column boundaries based on these clusters.
    # A column's boundary can be the min x1 of the cluster to the max x2 of blocks in that cluster.
    # For simplicity, let's define a column by its approximate start and end x.
    column_boundaries = []
    for cluster in column_x_clusters:
        min_x = min(cluster)
        # To determine the max_x for a column, we can look at all blocks whose x1 is in this cluster.
        # This is a bit more complex, so for now, let's use a simpler approach:
        # assume column width. Or, better, use the min x of the *next* cluster as the boundary.
        # If it's the last column, use a large arbitrary value.
        column_boundaries.append((min_x, min_x + 300)) # Assume approximate column width of 300 pixels
        # This assumption might be problematic if columns have very different widths.
        # A more robust solution would be to look at the maximum x2 for blocks within the cluster.

    # Let's refine column_boundaries to be more accurate based on the actual blocks, not just x1s.
    # Group all blocks by their approximate x1 cluster before defining precise column boundaries.
    clustered_blocks_by_x1 = {}
    for block in text_blocks_with_coords:
        assigned_to_cluster = False
        for cluster_idx, cluster in enumerate(column_x_clusters):
            # Check if block's x1 is within the range of this cluster (min to max of cluster x1s)
            if min(cluster) - 20 <= block['x1'] <= max(cluster) + 20: # Add buffer for slight variations
                if cluster_idx not in clustered_blocks_by_x1:
                    clustered_blocks_by_x1[cluster_idx] = []
                clustered_blocks_by_x1[cluster_idx].append(block)
                assigned_to_cluster = True
                break
        if not assigned_to_cluster:
            # Fallback for blocks that don't fit a cluster (e.g., images, or very wide blocks)
            # Assign to the closest cluster or a default wide column.
            # For simplicity for now, let's just add to the first column if not assigned.
            if len(column_x_clusters) > 0:
                if 0 not in clustered_blocks_by_x1:
                    clustered_blocks_by_x1[0] = []
                clustered_blocks_by_x1[0].append(block)
            else:
                # Should not happen if text_blocks_with_coords is not empty
                pass

    # Now, based on clustered_blocks_by_x1, define more accurate column boundaries.
    column_boundaries = []
    for cluster_idx in sorted(clustered_blocks_by_x1.keys()):
        blocks_in_cluster = clustered_blocks_by_x1[cluster_idx]
        if blocks_in_cluster:
            min_x_for_col = min(b['x1'] for b in blocks_in_cluster)
            max_x_for_col = max(b['x2'] for b in blocks_in_cluster)
            column_boundaries.append((min_x_for_col, max_x_for_col))

    # If no columns detected (e.g., very sparse page), default to a single wide column.
    if not column_boundaries and text_blocks_with_coords:
        min_x_overall = min(b['x1'] for b in text_blocks_with_coords)
        max_x_overall = max(b['x2'] for b in text_blocks_with_coords)
        column_boundaries = [(min_x_overall, max_x_overall)]
    elif not column_boundaries:
        return "" # No blocks to process

    # Sort column boundaries by their start x-coordinate (left to right)
    column_boundaries.sort(key=lambda c: c[0])

    # 3. Assign blocks to identified columns
    columns_grouped_blocks = {i: [] for i in range(len(column_boundaries))}
    
    for block in text_blocks_with_coords:
        assigned = False
        block_center_x = (block['x1'] + block['x2']) / 2 # Use center x for robust assignment

        for i, (col_x1, col_x2) in enumerate(column_boundaries):
            # Check if the block's center x-coordinate is within the column's x-range.
            # Add a small buffer to the column range to account for minor OCR inaccuracies
            # or blocks slightly spilling over boundaries.
            if block_center_x >= col_x1 - 10 and block_center_x <= col_x2 + 10:
                columns_grouped_blocks[i].append(block)
                assigned = True
                break
        
        if not assigned:
            # Fallback: if a block doesn't fit any column, assign to the closest one
            closest_col_idx = 0
            min_distance = float('inf')
            for i, (col_x1, col_x2) in enumerate(column_boundaries):
                col_center_x = (col_x1 + col_x2) / 2
                distance = abs(block_center_x - col_center_x)
                if distance < min_distance:
                    min_distance = distance
                    closest_col_idx = i
            columns_grouped_blocks[closest_col_idx].append(block)

    # 4. Process each column individually (vertical sorting) and concatenate
    final_output_parts = []
    for col_idx in sorted(columns_grouped_blocks.keys()):
        column_blocks = columns_grouped_blocks[col_idx]
        if not column_blocks:
            continue

        # Sort blocks within this column by y1 (vertical position), then x1 (horizontal for tie-breaking)
        column_blocks.sort(key=lambda b: (b['y1'], b['x1']))

        column_text_content = ""
        for block in column_blocks:
            column_text_content += block['text'] + "\n"
        
        if column_text_content:
            final_output_parts.append(column_text_content.strip())

    # 5. Concatenate columns with a separator (e.g., double newline between columns)
    raw_ocr_output = "\n\n".join(final_output_parts)
    return raw_ocr_output

def get_pdf_page_range(pdf_path, start_page, end_page):
    """Determines the actual page range to process for a PDF."""
    pdf_info = pdfinfo_from_path(pdf_path)
    total_pages = pdf_info['Pages']
    print(f"Total pages in PDF: {total_pages}")

    actual_start_page = 1 if start_page is None else max(1, start_page)
    actual_end_page = total_pages if end_page is None else min(total_pages, end_page)

    if actual_start_page > actual_end_page:
        print(f"Warning: Start page ({start_page}) is after end page ({end_page}). No pages to process.")
        return []

    return list(range(actual_start_page, actual_end_page + 1))

def get_text_files_in_range(input_dir, pdf_name_prefix, start_page, end_page):
    """Lists and filters text files by page number within a given range."""
    all_files = os.listdir(input_dir)
    text_files = []
    for f in all_files:
        if f.startswith(pdf_name_prefix) and f.endswith('.txt'):
            try:
                file_page_num = int(f.split(pdf_name_prefix)[1].split('.txt')[0])
                if (start_page is None or file_page_num >= start_page) and \
                   (end_page is None or file_page_num <= end_page):
                    text_files.append((f, file_page_num))
                else:
                    print(f"Skipping {f}: outside specified page range ({start_page or 'min'}-{end_page or 'max'})")
            except (IndexError, ValueError) as e:
                print(f"Warning: Could not parse page number from text file {f} (Error: {e}). Skipping.")
                continue
    
    text_files.sort(key=lambda x: x[1])
    return [os.path.join(input_dir, f[0]) for f in text_files]

def get_existing_files_for_pdf(directory, pdf_name, start_page, end_page, extension):
    """Scans a directory for files related to a specific PDF and page range,
    matching the naming convention (e.g., pdfname_XXXXXX.ext).
    Returns a sorted list of full file paths.
    """
    print(f"Checking for existing files in {directory}")
    found_files = []
    if not os.path.isdir(directory):
        print(f"Warning: Directory not found: {directory}. Cannot check for existing files.")
        return []

    for f in os.listdir(directory):
        # Correctly form the startswith pattern based on how files are saved (pdfname_XXXXXX.ext)
        starts_with_pattern = f"{pdf_name}_"
        ends_with_pattern = f".{extension}"

        if f.startswith(starts_with_pattern) and f.endswith(ends_with_pattern):
            try:
                # Use a single regex pattern that handles both pdfname_XXXXXX.ext and pdfname_pgXXXXXX.ext
                pattern = rf"{re.escape(pdf_name)}_(?:pg)?(?P<pg_num>\d+)\.{re.escape(extension)}"
                
                match = re.search(pattern, f)
                
                if match:
                    file_page_num = int(match.group('pg_num'))
                    if (start_page is None or file_page_num >= start_page) and \
                       (end_page is None or file_page_num <= end_page):
                        found_files.append((os.path.join(directory, f), file_page_num))
                    else:
                        print(f"Skipping {f}: outside specified page range ({start_page or 'min'}-{end_page or 'max'})")
                else:
                    print(f"Warning: Could not parse page number from {f} with pattern '{pattern}'. Skipping.")
            except (IndexError, ValueError) as e:
                print(f"Warning: Could not parse page number from filename {f} (Error: {e}). Skipping.")
                continue

    found_files.sort(key=lambda x: x[1])
    return [path for path, _ in found_files]

# --- Action Functions (will be called by main) ---
def action_extract_images(config, pdf_path, start_page, end_page):
    """Action: Extracts and caches PDF pages as images, only generating missing ones."""
    image_dir = config['paths'].get('image_dir')
    output_image_dir = image_dir or tempfile.mkdtemp()
    pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
    
    # Create a PDF-specific subfolder within the image directory
    pdf_image_output_dir = os.path.join(output_image_dir, pdf_name)
    os.makedirs(pdf_image_output_dir, exist_ok=True)

    image_paths = []

    pages_to_convert = get_pdf_page_range(pdf_path, start_page, end_page)
    if not pages_to_convert:
        print("No pages to extract within the specified range.")
        return []

    print(f"Using image output directory: {pdf_image_output_dir}")

    try:
        for page_num in pages_to_convert:
            expected_img_file = f"{pdf_name}_{str(page_num).zfill(6)}.png"
            expected_img_path = os.path.join(pdf_image_output_dir, expected_img_file)

            print(f"Checking for cached image: {expected_img_path}")
            if os.path.exists(expected_img_path):
                print(f"Found cached image for page {page_num}: {expected_img_file}")
                image_paths.append(expected_img_path)
            else:
                print(f"Cached image NOT found for page {page_num}. Generating and saving...")
                pages_list = convert_from_path(
                    pdf_path,
                    dpi=300,
                    first_page=page_num,
                    last_page=page_num,
                    fmt='png'
                )
                
                if pages_list:
                    page_image = pages_list[0]
                    page_image.save(expected_img_path, format="PNG")
                    print(f"Generated and saved image for page {page_num}: {expected_img_path}")
                    image_paths.append(expected_img_path)
                else:
                    print(f"Warning: Could not generate image for page {page_num}.")
    except Exception as e:
        print(f"❌ Failed to extract images from PDF {pdf_path}: {e}")
    
    image_paths.sort(key=lambda f: int(os.path.basename(f).split(f'{pdf_name}_')[1].split('.png')[0]))

    return image_paths

def action_ocr_images(config, image_paths):
    """Action: Calls OCR endpoint for images and saves the raw JSON responses and associated images."""
    base_ocr_output_dir = config['paths']['ocr_output_dir']
    # ocr_marked_image_dir and doc_preprocessing_image_dir will now be created per PDF

    if not image_paths:
        print("No images provided for OCR.")
        return

    for img_path in image_paths:
        file_name = os.path.basename(img_path)
        pdf_name = os.path.splitext(file_name.split('_')[0])[0] # Assuming pdf_name_XXXXXX.png
        page_number_from_filename = None
        try:
            match = re.search(r'(\d+)\.png$', file_name)
            if match:
                page_number_from_filename = int(match.group(1))
            else:
                raise ValueError("Filename does not match expected patterns.")
        except (IndexError, ValueError) as e:
            print(f"Warning: Could not parse page number from filename {file_name} (Error: {e}). Skipping for output naming.")
            page_number_from_filename = "unknown"

        # Create PDF-specific subfolders for JSON, Markdown, and marked images
        pdf_ocr_json_dir = os.path.join(base_ocr_output_dir, pdf_name, "json")
        pdf_ocr_markdown_dir = os.path.join(base_ocr_output_dir, pdf_name, "markdown")
        pdf_ocr_marked_image_dir = os.path.join(base_ocr_output_dir, pdf_name, "marked_images")
        pdf_doc_preprocessing_image_dir = os.path.join(base_ocr_output_dir, pdf_name, "doc_preprocessing_images")

        os.makedirs(pdf_ocr_json_dir, exist_ok=True)
        os.makedirs(pdf_ocr_markdown_dir, exist_ok=True)
        os.makedirs(pdf_ocr_marked_image_dir, exist_ok=True)
        os.makedirs(pdf_doc_preprocessing_image_dir, exist_ok=True)

        output_file_base = f"{pdf_name}_pg{page_number_from_filename}"
        ocr_json_path = os.path.join(pdf_ocr_json_dir, f"{output_file_base}.json")
        ocr_image_path = os.path.join(pdf_ocr_marked_image_dir, f"{output_file_base}_ocr.jpeg")
        doc_preprocessing_image_path = os.path.join(pdf_doc_preprocessing_image_dir, f"{output_file_base}_doc.jpeg")

        print(f"🧹 Calling OCR endpoint for {file_name}...")
        try:
            with Image.open(img_path) as page_image:
                original_width, original_height = page_image.size
                new_width = config['settings']['image_resize_width']
                new_height = int(original_height * (new_width / original_width))
                resized_image = page_image.resize((new_width, new_height), Image.LANCZOS)
                page_np = np.array(resized_image)

            image_base64 = encode_image_to_base64(page_np)
            
            raw_ocr_response = call_ocr_endpoint(image_base64)
            
            if raw_ocr_response and "result" in raw_ocr_response and raw_ocr_response["result"] and "layoutParsingResults" in raw_ocr_response["result"]:
                ocr_result = raw_ocr_response['result']['layoutParsingResults'][0] # Assuming always one result object

                # Save prunedResult JSON
                if "prunedResult" in ocr_result:
                    with open(ocr_json_path, "w", encoding="utf-8") as f:
                        json.dump(ocr_result['prunedResult'], f, indent=2)
                        print(f"✅ Saved prunedResult JSON to {ocr_json_path}")
                else:
                    print(f"Warning: No 'prunedResult' found in OCR response for {file_name}.")

                if "markdown" in ocr_result:
                    with open(os.path.join(pdf_ocr_markdown_dir, f"{output_file_base}.md"), "w", encoding="utf-8") as f:
                        f.write(ocr_result['markdown']['text'])

            else:
                print(f"Warning: No valid OCR response from endpoint for {file_name}.")
        except Exception as e:
            print(f"❌ Failed to OCR {file_name}: {e}")

    # This action no longer returns current_ocr_json_paths as the next step will scan for them.
    return

def action_process_ocr_json(config, ocr_json_paths):
    """Action: Processes raw OCR JSON files into spatially ordered text blocks and saves them."""
    base_ocr_output_dir = config['paths']['ocr_output_dir']
    raw_text_paths = []

    if not ocr_json_paths:
        print("No raw OCR JSON files provided for processing.")
        return []

    for json_path in ocr_json_paths:
        file_name = os.path.basename(json_path)
        # Extract pdf_name from the json_path (e.g., 'pdfname_pgXXXXXX.json' -> 'pdfname')
        pdf_name = os.path.splitext(file_name.split('_')[0])[0]
        page_number_from_filename = None
        try:
            match = re.search(r'(\d+)\.json$', file_name)
            if match:
                page_number_from_filename = int(match.group(1))
            else:
                raise ValueError("Filename does not match expected patterns.")
        except (IndexError, ValueError) as e:
            print(f"Warning: Could not parse page number from filename {file_name} (Error: {e}). Skipping for output naming.")
            page_number_from_filename = "unknown"

        # Create PDF-specific subfolder for raw text output within ocr_output_dir
        pdf_raw_text_output_dir = os.path.join(base_ocr_output_dir, pdf_name, "raw_text")
        os.makedirs(pdf_raw_text_output_dir, exist_ok=True)

        output_file_name_base = f"{pdf_name}_pg{page_number_from_filename}"
        raw_text_path = os.path.join(pdf_raw_text_output_dir, f"{output_file_name_base}.txt")

        print(f"🧹 Processing raw OCR JSON from {file_name}...")
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                raw_ocr_data = json.load(f)
            
            ordered_text = process_ocr_blocks(raw_ocr_data)

            if ordered_text:
                # Remove multiple spaces with a single space
                ordered_text = re.sub(r' +', ' ', ordered_text)
                # Remove empty lines (lines containing only whitespace)
                ordered_text = re.sub(r'^\s*$\n', '', ordered_text, flags=re.MULTILINE)

                with open(raw_text_path, "w", encoding="utf-8") as f:
                    f.write(ordered_text)
                    print(f"✅ Saved ordered text to {raw_text_path}")
                raw_text_paths.append(raw_text_path)
            else:
                print(f"Warning: No ordered text extracted from {file_name}.")
        except Exception as e:
            print(f"❌ Failed to process OCR JSON from {file_name}: {e}")

    return raw_text_paths

def action_llm_cleanup_text(config, text_paths):
    """Action: Sends raw text files to Ollama for markdown tagging and cleanup."""
    base_ocr_output_dir = config['paths']['ocr_output_dir']
    
    if not text_paths:
        print("No text files provided for LLM cleanup.")
        return

    for text_path in text_paths:
        file_name = os.path.basename(text_path)
        # Assuming text_path is like pdfname_pgXXX.txt
        # Extract pdf_name from the text_path (e.g., 'pdfname_pgXXXXXX.txt' -> 'pdfname')
        pdf_name = os.path.splitext(file_name.split('_pg')[0])[0]
        
        # Create PDF-specific subfolder for cleaned markdown output within ocr_output_dir
        markdown_output_dir = os.path.join(base_ocr_output_dir, pdf_name, "cleaned_markdown")
        os.makedirs(markdown_output_dir, exist_ok=True)

        output_file_name_base = file_name.replace('.txt', '')
        final_output_path = os.path.join(markdown_output_dir, f"{output_file_name_base}.md")

        print(f"🧹 Cleaning {file_name} with Ollama ({config['llm_model_name']}) for markdown tagging...")
        try:
            with open(text_path, "r", encoding="utf-8") as f:
                raw_text = f.read()

            cleaned_markdown = clean_with_ollama(config, text_content=raw_text)
            
            with open(final_output_path, "w", encoding="utf-8") as f:
                f.write(cleaned_markdown)
                print(f"✅ Saved markdown output to {final_output_path}")
        except Exception as e:
            print(f"❌ Failed to clean {file_name}: {e}")

def main():
    global config

    parser = argparse.ArgumentParser(
        description="Process PDFs for OCR and LLM cleanup.",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "--config_file",
        type=str,
        help="Path to the JSON configuration file. Defaults to ./conf/ocr.json",
        default=None # Will be handled by load_config
    )
    parser.add_argument(
        "--pdf_file",
        type=str,
        required=True,
        help="Path to the PDF file to process. Can be a full path or a filename within pdf_dir."
    )
    parser.add_argument(
        "--actions",
        type=str,
        nargs='+',
        choices=['extract_images', 'ocr_images', 'llm_cleanup_text', 'process_ocr_json'],
        required=True,
        help="List of actions to perform (e.g., --actions extract_images ocr_images llm_cleanup_text).\nAvailable actions:\n  - extract_images: Converts PDF pages to images and caches them.\n  - ocr_images: Performs OCR on images and saves the raw text output.\n  - llm_cleanup_text: Cleans and formats raw text files into markdown using an LLM.\n  - process_ocr_json: Processes raw OCR JSON files into ordered text blocks."
    )
    parser.add_argument(
        "--start_page",
        type=int,
        default=None,
        help="Starting page number for PDF processing (inclusive)."
    )
    parser.add_argument(
        "--end_page",
        type=int,
        default=None,
        help="Ending page number for PDF processing (inclusive)."
    )

    args = parser.parse_args()

    try:
        config = load_config(args.config_file)

    except FileNotFoundError as e:
        print(f"Configuration error: {e}")
        sys.exit(1)
    except KeyError as e:
        print(f"Configuration error: Missing key in config file - {e}")
        sys.exit(1)

    # Resolve pdf_path: if not absolute, use pdf_dir from config
    pdf_path = args.pdf_file
    if not os.path.isabs(pdf_path):
        pdf_base_dir = config['paths']['pdf_dir']
        pdf_path = os.path.join(pdf_base_dir, pdf_path)
        print(f"Resolved PDF path to: {pdf_path}")

    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found at {pdf_path}")
        sys.exit(1)

    actions = args.actions # actions is already a list due to nargs='+' and choices

    # Determine PDF name and page range for consistent file lookup
    pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]

    # --- Shared state for actions ---
    current_image_paths = []
    current_ocr_json_paths = [] # To store paths to raw OCR JSON files
    current_raw_text_paths = []
    
    # Ensure output directories exist
    # os.makedirs(config['paths']['raw_text_dir'], exist_ok=True) # Removed as raw_text_dir is now relative to ocr_output_dir
    os.makedirs(config['paths']['ocr_output_dir'], exist_ok=True)
    # os.makedirs(config['paths']['ocr_marked_image_dir'], exist_ok=True) # Removed as it's now created per PDF
    # os.makedirs(config['paths']['doc_preprocessing_image_dir'], exist_ok=True) # Removed as it's now created per PDF

    for action in actions:
        if action == "extract_images":
            current_image_paths = action_extract_images(config, pdf_path, args.start_page, args.end_page)
            if not current_image_paths:
                print(f"Action '{action}' resulted in no images. Stopping further actions.")
                break
        elif action == "ocr_images":
            if not current_image_paths:
                print(f"Action '{action}' requires images from a previous step (e.g., 'extract_images').")
                print(f"Attempting to load existing images from {config['paths']['image_dir']}...")
                image_load_path = os.path.join(config['paths']['image_dir'], pdf_name)
                current_image_paths = get_existing_files_for_pdf(image_load_path, pdf_name, args.start_page, args.end_page, 'png')
                if not current_image_paths:
                    print(f"No existing images found. Skipping action '{action}'.")
                    continue
            action_ocr_images(config, current_image_paths) # This action no longer returns paths
            # The next step (process_ocr_json) will scan for the JSON files itself
            current_ocr_json_paths = [] # Clear for explicit scanning by next action

        elif action == "process_ocr_json":
            if not current_ocr_json_paths:
                print(f"Action '{action}' requires raw OCR JSON files from a previous step (e.g., 'ocr_images').")
                print(f"Attempting to load existing OCR JSON files from {config['paths']['ocr_output_dir']}...")
                # When loading OCR JSON files, we need to specify the correct subdirectory
                ocr_json_load_path = os.path.join(config['paths']['ocr_output_dir'], pdf_name, "json")
                current_ocr_json_paths = get_existing_files_for_pdf(ocr_json_load_path, pdf_name, args.start_page, args.end_page, 'json')
                if not current_ocr_json_paths:
                    print(f"No existing OCR JSON files found. Skipping action '{action}'.")
                    continue
            current_raw_text_paths = action_process_ocr_json(config, current_ocr_json_paths)
            if not current_raw_text_paths:
                print(f"Action '{action}' resulted in no ordered text files. Stopping further actions.")
                break
        elif action == "llm_cleanup_text":
            if not current_raw_text_paths:
                print(f"Action '{action}' requires raw text files from a previous step (e.g., 'process_ocr_json').")
                # Update this path to reflect the new structure
                raw_text_load_path = os.path.join(config['paths']['ocr_output_dir'], pdf_name, "raw_text")
                print(f"Attempting to load existing raw text files from {raw_text_load_path}...")
                current_raw_text_paths = get_existing_files_for_pdf(raw_text_load_path, pdf_name, args.start_page, args.end_page, 'txt')
                if not current_raw_text_paths:
                    print(f"No existing raw text files found. Skipping action '{action}'.")
                    continue
            action_llm_cleanup_text(config, current_raw_text_paths)
        else:
            print(f"Unknown action: {action}. Skipping.")

if __name__ == "__main__":
    main()

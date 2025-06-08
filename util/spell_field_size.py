import csv
import argparse
from collections import defaultdict

def make_unique_headers(headers):
    counter = defaultdict(int)
    unique_headers = []
    
    for h in headers:
        if counter[h] == 0:
            unique_headers.append(h)
        else:
            unique_headers.append(f"{h}{counter[h]}")
        counter[h] += 1
    return unique_headers

def parse_csv_to_dicts(file_path):
    data = []
    try:
        with open(file_path, newline='', encoding='cp1252') as csvfile:
            reader = csv.reader(csvfile)
            raw_headers = next(reader)
            headers = make_unique_headers(raw_headers)
            
            for row in reader:
                row_dict = dict(zip(headers, row))
                data.append(row_dict)
        return data
    except FileNotFoundError:
        print(f"Error: File '{file_path}' not found.")
        return []
    except Exception as e:
        print(f'An error occurred: {e}')
        return []

def main():
    keys_to_count = ['Spell Name','School','Comp','Cast','Range','Duration','Save','SR','Description']

    parser = argparse.ArgumentParser(description='Parse a CSV file.')
    parser.add_argument('-f', '--file', help='Path to the CSV file', required=True)
    args = parser.parse_args()

    count_keys = {}
    records = parse_csv_to_dicts(args.file)
    for record in records:
        filtered = {k: v for k, v in record.items() if k in keys_to_count and v and str(v).strip()}
        if filtered:
            for k in keys_to_count:
                if k in count_keys and k in filtered and len(filtered[k]) <= count_keys[k]:
                    continue
                elif k in filtered:
                    count_keys[k] = len(filtered[k])

    for key, count in count_keys.items():
        print(f'Field: {key} Max Len: {count}')

if __name__ == '__main__':
    main()

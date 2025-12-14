# ArchivoNarrow Font Conversion Instructions

This document provides step-by-step instructions for converting ArchivoNarrow TTF font files to JavaScript modules compatible with jsPDF 2.5.

## Prerequisites

- Access to jsPDF Font Converter tool
- All 8 ArchivoNarrow TTF files located in `public/assets/fonts/`

## Font Files to Convert

1. `ArchivoNarrow-Regular.ttf`
2. `ArchivoNarrow-Bold.ttf`
3. `ArchivoNarrow-Italic.ttf`
4. `ArchivoNarrow-BoldItalic.ttf`
5. `ArchivoNarrow-Medium.ttf`
6. `ArchivoNarrow-MediumItalic.ttf`
7. `ArchivoNarrow-SemiBold.ttf`
8. `ArchivoNarrow-SemiBoldItalic.ttf`

## Conversion Steps

### Step 1: Access jsPDF Font Converter

1. Navigate to the jsPDF Font Converter tool:
   - Online: https://parallax.github.io/jsPDF/fontconverter/fontconverter.html
   - Or use the local version from the jsPDF repository if available

### Step 2: Convert Each TTF File

For each of the 8 TTF files:

1. Open the font converter tool in your browser
2. Click "Choose File" or "Browse" button
3. Select the TTF file from `public/assets/fonts/` (e.g., `ArchivoNarrow-Regular.ttf`)
4. Wait for the conversion to complete
5. The converter will generate a JavaScript file with base64-encoded font data
6. Copy the generated JavaScript code

### Step 3: Create JavaScript Module Files

For each converted font, create a corresponding `.js` file in `src/assets/fonts/`:

#### File Format

The generated JS file should export the base64-encoded font data. The standard format is:

```javascript
// For example: ArchivoNarrow-Regular.js
export default 'BASE64_ENCODED_FONT_DATA_HERE';
```

Or if the converter uses a different format:

```javascript
// Alternative format
const fontData = 'BASE64_ENCODED_FONT_DATA_HERE';
export default fontData;
```

#### File Naming

Create files with these exact names in `src/assets/fonts/`:
- `ArchivoNarrow-Regular.js`
- `ArchivoNarrow-Bold.js`
- `ArchivoNarrow-Italic.js`
- `ArchivoNarrow-BoldItalic.js`
- `ArchivoNarrow-Medium.js`
- `ArchivoNarrow-MediumItalic.js`
- `ArchivoNarrow-SemiBold.js`
- `ArchivoNarrow-SemiBoldItalic.js`

### Step 4: Verify File Structure

Each `.js` file should:
- Export a default string containing the base64-encoded font data
- Be placed in `src/assets/fonts/` directory
- Match the naming convention exactly (case-sensitive)

### Step 5: Test the Integration

After creating all 8 font files:

1. The `registerArchivoNarrow.ts` module should be able to import them
2. Run the application and test PDF generation
3. Verify that ArchivoNarrow fonts are used instead of Helvetica

## Troubleshooting

### If the converter output format differs:

The jsPDF font converter may output files in different formats. Common variations:

1. **Default export format** (preferred):
   ```javascript
   export default 'BASE64_DATA';
   ```

2. **Named export format**:
   ```javascript
   export const fontData = 'BASE64_DATA';
   export default fontData;
   ```

3. **CommonJS format** (needs conversion):
   ```javascript
   module.exports = 'BASE64_DATA';
   ```
   Convert to: `export default 'BASE64_DATA';`

### If imports fail:

- Ensure all 8 `.js` files exist in `src/assets/fonts/`
- Check that file names match exactly (case-sensitive)
- Verify that each file exports a default string value
- Check browser console for import errors

## Notes

- The base64-encoded font data will be quite large (typically 20-50KB per font file)
- jsPDF's font converter handles the encoding automatically
- The font registration happens at runtime when `registerArchivoNarrowFonts()` is called
- Fonts must be registered before any `setFont()` calls in the PDF generation code


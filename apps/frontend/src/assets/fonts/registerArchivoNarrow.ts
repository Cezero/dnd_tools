import jsPDF from 'jspdf';

// Import font files as side effects - they will register themselves via jsPDF.API.events
// The generated files add fonts to VFS and register them, but with variant-specific names
// We need to re-register them with the unified 'ArchivoNarrow' name
import './ArchivoNarrow-Regular.js';
import './ArchivoNarrow-Bold.js';
import './ArchivoNarrow-Italic.js';
import './ArchivoNarrow-BoldItalic.js';

/**
 * Register all ArchivoNarrow font variants with a jsPDF instance
 * Must be called before using setFont('ArchivoNarrow', ...)
 *
 * The font files are imported as side effects and register themselves via jsPDF.API.events.
 * However, they register with variant-specific names (e.g., 'ArchivoNarrow-Regular').
 * This function re-registers them with the unified 'ArchivoNarrow' name and appropriate styles.
 *
 * @param doc - The jsPDF instance to register fonts with
 */
export function registerArchivoNarrowFonts(doc: jsPDF): void {
    // The generated font files register fonts with names like 'ArchivoNarrow-Regular', 'ArchivoNarrow-Bold', etc.
    // We need to re-register them with the unified 'ArchivoNarrow' name.
    // The VFS filenames used by the generated files are:
    // - 'ArchivoNarrow-Regular-normal.ttf'
    // - 'ArchivoNarrow-Bold-bold.ttf'
    // - 'ArchivoNarrow-Italic-italic.ttf'
    // - 'ArchivoNarrow-BoldItalic-bolditalic.ttf'

    // Re-register Regular as 'ArchivoNarrow' with 'normal' style
    doc.addFont('ArchivoNarrow-Regular-normal.ttf', 'ArchivoNarrow', 'normal');

    // Re-register Bold as 'ArchivoNarrow' with 'bold' style
    doc.addFont('ArchivoNarrow-Bold-bold.ttf', 'ArchivoNarrow', 'bold');

    // Re-register Italic as 'ArchivoNarrow' with 'italic' style
    doc.addFont('ArchivoNarrow-Italic-italic.ttf', 'ArchivoNarrow', 'italic');

    // Re-register BoldItalic as 'ArchivoNarrow' with 'bolditalic' style
    doc.addFont('ArchivoNarrow-BoldItalic-bolditalic.ttf', 'ArchivoNarrow', 'bolditalic');
}


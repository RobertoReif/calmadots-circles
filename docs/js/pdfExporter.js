/**
 * PDF Exporter Module
 * Handles PDF export using jsPDF library
 * Note: jsPDF must be included in HTML before this module
 */

class PDFExporter {
    constructor() {
        // jsPDF UMD bundle exposes as window.jspdf.jsPDF (lowercase jspdf namespace)
        this.jsPDFLib = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF || null;
        this.pdfLibraryLoaded = this.jsPDFLib !== null && typeof this.jsPDFLib !== 'undefined';

        if (!this.pdfLibraryLoaded) {
            console.warn('[PDFExporter] jsPDF library not found. Check that jspdf.umd.min.js is loaded before pdfExporter.js');
        }
    }

    /**
     * Check if PDF library is available
     * @returns {boolean}
     */
    isLibraryLoaded() {
        return this.pdfLibraryLoaded;
    }

    /**
     * Export circle visualization to PDF
     * @param {HTMLCanvasElement} canvas - Circle visualization canvas
     * @param {string} filename - Output filename
     * @param {object} options - Export options
     * @param {string} originalFilename - Original image filename (for metadata)
     * @param {object} imageMetadata - Image metadata (width, height, settings)
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async exportToPDF(
        canvas,
        filename = 'circlesize.pdf',
        options = {},
        originalFilename = 'image',
        imageMetadata = null
    ) {
        try {
            if (!this.pdfLibraryLoaded) {
                return {
                    success: false,
                    message: 'jsPDF library not loaded. Cannot export to PDF.',
                };
            }

            // Set defaults
            const defaultOptions = {
                quality: 'standard', // 'standard' or 'high'
                includeMetadata: false, // Don't include metadata by default
            };

            const finalOptions = { ...defaultOptions, ...options };

            // Determine PDF orientation and page size
            const canvasRatio = canvas.width / canvas.height;
            const pageOrientation = canvasRatio > 1 ? 'l' : 'p'; // landscape or portrait

            // Create PDF with appropriate page size
            const pdf = new this.jsPDFLib({
                orientation: pageOrientation,
                unit: 'mm',
                format: 'a4'
            });

            // Get page dimensions
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 12; // Equal margin on all sides

            // Create padded canvas to prevent edge circles from being cropped
            // Use larger padding (50px) to ensure even circles at edges are fully visible
            const padPixels = 50; // pixels of padding around the canvas
            const paddedCanvas = document.createElement('canvas');
            paddedCanvas.width = canvas.width + (padPixels * 2);
            paddedCanvas.height = canvas.height + (padPixels * 2);

            const paddedCtx = paddedCanvas.getContext('2d');
            // Fill with white background
            paddedCtx.fillStyle = '#ffffff';
            paddedCtx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
            // Draw original canvas in center
            paddedCtx.drawImage(canvas, padPixels, padPixels);

            // Calculate max dimensions for image on page (with equal margins)
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - (margin * 2);

            // Calculate scaling to fit on page while preserving aspect ratio
            let imgWidth = maxWidth;
            let imgHeight = (paddedCanvas.height / paddedCanvas.width) * imgWidth;

            if (imgHeight > maxHeight) {
                imgHeight = maxHeight;
                imgWidth = (paddedCanvas.width / paddedCanvas.height) * imgHeight;
            }

            // Center image on page with equal margins on all sides
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeight - imgHeight) / 2;

            // Convert padded canvas to image data
            const imgData = paddedCanvas.toDataURL('image/png');

            // Add image to PDF
            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

            // Add metadata if requested (positioned below image with proper spacing)
            if (finalOptions.includeMetadata && imageMetadata) {
                pdf.setFontSize(8);
                let yPos = y + imgHeight + 3;
                pdf.text(`Image: ${originalFilename}`, margin, yPos);
                yPos += 3;
                pdf.text(`Size: ${imageMetadata.imageWidth}×${imageMetadata.imageHeight}px`, margin, yPos);
                if (imageMetadata.minRadius) {
                    yPos += 3;
                    pdf.text(`Circles: min=${imageMetadata.minRadius}px, max=${imageMetadata.maxRadius}px`, margin, yPos);
                }
            }

            // Save PDF
            pdf.save(filename);

            return {
                success: true,
                message: `PDF exported successfully: ${filename}`,
            };
        } catch (error) {
            return {
                success: false,
                message: `PDF export failed: ${error.message}`,
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFExporter;
}

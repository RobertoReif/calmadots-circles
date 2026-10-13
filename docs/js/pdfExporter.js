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
            const margin = 2.54; // 0.1 inch margin on all sides (2.54mm = 0.1 inch)

            // Canvas has padding from renderCircles() - use it directly
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            // Calculate max available space on page with equal margins
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - (margin * 2);

            // Calculate scaling to fit on page while preserving aspect ratio
            // The canvas already has all the padding it needs
            let imgWidth = maxWidth;
            let imgHeight = (canvasHeight / canvasWidth) * imgWidth;

            if (imgHeight > maxHeight) {
                imgHeight = maxHeight;
                imgWidth = (canvasWidth / canvasHeight) * imgHeight;
            }

            // Center image perfectly on page with equal margins on all 4 sides
            // This centers the entire canvas (including its padding) on the page
            const x = margin + ((maxWidth - imgWidth) / 2);
            const y = margin + ((maxHeight - imgHeight) / 2);

            // Convert canvas to image data
            const imgData = canvas.toDataURL('image/png');

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

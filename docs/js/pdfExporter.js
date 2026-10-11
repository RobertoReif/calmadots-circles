/**
 * PDF Exporter Module
 * Handles PDF export using SimplePdfGenerator (zero dependencies)
 * Note: SimplePdfGenerator must be included in HTML before this module
 */

class PDFExporter {
    constructor() {
        this.pdfGeneratorLoaded = typeof SimplePdfGenerator !== 'undefined';
    }

    /**
     * Check if PDF generator is available
     * @returns {boolean}
     */
    isLibraryLoaded() {
        return this.pdfGeneratorLoaded;
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
            if (!this.pdfGeneratorLoaded) {
                return {
                    success: false,
                    message: 'SimplePdfGenerator not loaded. Cannot export to PDF.',
                };
            }

            // Set defaults
            const defaultOptions = {
                quality: 'standard', // 'standard' or 'high'
                includeMetadata: true,
            };

            const finalOptions = { ...defaultOptions, ...options };

            // Prepare metadata for PDF
            const metadata = {
                filename: originalFilename,
                timestamp: new Date().toLocaleString(),
            };

            if (imageMetadata) {
                metadata.imageWidth = imageMetadata.imageWidth;
                metadata.imageHeight = imageMetadata.imageHeight;
                if (imageMetadata.minRadius) {
                    metadata.minRadius = imageMetadata.minRadius;
                    metadata.maxRadius = imageMetadata.maxRadius;
                }
            }

            // Create PDF using SimplePdfGenerator
            const pdfBlob = SimplePdfGenerator.canvasToPdf(canvas, filename, metadata);

            // Download PDF
            SimplePdfGenerator.downloadPdf(pdfBlob, filename);

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

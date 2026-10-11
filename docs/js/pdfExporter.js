/**
 * PDF Exporter Module
 * Handles PDF export using jsPDF
 * Note: jsPDF library must be included in HTML
 */

class PDFExporter {
    constructor() {
        this.pdfLibraryLoaded = typeof jsPDF !== 'undefined';
    }

    /**
     * Check if jsPDF library is loaded
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
                includeMetadata: true,
                format: 'a4', // PDF page format
            };

            const finalOptions = { ...defaultOptions, ...options };

            // Get canvas as PNG image
            const imageQuality = finalOptions.quality === 'high' ? 0.95 : 0.85;
            const imageDataURL = canvas.toDataURL('image/png', imageQuality);

            // Calculate PDF dimensions
            const pdfWidth = 210; // A4 width in mm
            const aspectRatio = canvas.height / canvas.width;
            let pdfHeight = pdfWidth * aspectRatio;

            // Limit height to A4 max (297mm)
            const maxPdfHeight = 297;
            if (pdfHeight > maxPdfHeight) {
                pdfHeight = maxPdfHeight;
            }

            // Create PDF document
            const pdf = new jsPDF('p', 'mm', 'a4');

            // Add title
            pdf.setFontSize(16);
            pdf.text('CircleSize Art', 105, 15, { align: 'center' });

            // Add metadata if requested
            if (finalOptions.includeMetadata && imageMetadata) {
                pdf.setFontSize(10);
                pdf.setTextColor(102, 102, 102); // Gray color

                let metadataY = 25;
                const metadataLines = this._generateMetadataLines(imageMetadata, originalFilename);

                metadataLines.forEach((line) => {
                    pdf.text(line, 10, metadataY);
                    metadataY += 4;
                });

                pdf.setTextColor(0, 0, 0); // Reset to black
            }

            // Add image to PDF
            const imageY = finalOptions.includeMetadata ? 45 : 25;
            const imageWidth = pdfWidth - 20; // 10mm margin on each side
            const imageHeight = (imageWidth * canvas.height) / canvas.width;

            // Ensure image fits on page
            let finalImageHeight = imageHeight;
            if (imageY + finalImageHeight > maxPdfHeight - 10) {
                finalImageHeight = maxPdfHeight - 10 - imageY;
            }

            pdf.addImage(imageDataURL, 'PNG', 10, imageY, imageWidth, finalImageHeight);

            // Add footer
            pdf.setFontSize(8);
            pdf.setTextColor(153, 153, 153); // Light gray
            pdf.text(
                'Created with CircleSize - https://github.com/RobertoReif/calmadots-circles',
                105,
                maxPdfHeight - 5,
                { align: 'center' }
            );

            // Set document properties
            pdf.setProperties({
                title: `CircleSize - ${originalFilename}`,
                subject: 'Circle Art Visualization',
                author: 'CircleSize',
                keywords: 'circle art, image processing',
                creator: 'CircleSize v1.0',
            });

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

    /**
     * Generate metadata lines for PDF footer
     * @private
     */
    _generateMetadataLines(metadata, originalFilename) {
        const lines = [];
        const date = new Date();
        const timestamp = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        lines.push(`Original: ${originalFilename}`);

        if (metadata.imageWidth && metadata.imageHeight) {
            lines.push(`Image Size: ${metadata.imageWidth} × ${metadata.imageHeight} px`);
        }

        if (metadata.minRadius && metadata.maxRadius) {
            lines.push(
                `Circle Settings: min=${metadata.minRadius}px, max=${metadata.maxRadius}px`
            );
        }

        lines.push(`Exported: ${timestamp}`);

        return lines;
    }

    /**
     * Check if jsPDF needs to be loaded from CDN
     * @returns {string|null} Script tag HTML if needed, null if already loaded
     */
    static getJsPDFScriptTag() {
        if (typeof jsPDF !== 'undefined') {
            return null;
        }

        return '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFExporter;
}

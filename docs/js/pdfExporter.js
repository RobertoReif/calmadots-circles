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
        console.log('exportToPDF called with:', { filename, options, originalFilename });
        try {
            if (!this.pdfLibraryLoaded) {
                console.log('PDF library not loaded');
                return {
                    success: false,
                    message: 'jsPDF library not loaded. Cannot export to PDF.',
                };
            }
            console.log('PDF library is loaded, proceeding with export');

            // Set defaults
            const defaultOptions = {
                quality: 'standard', // 'standard' or 'high'
                includeMetadata: false, // Don't include metadata by default
            };

            const finalOptions = { ...defaultOptions, ...options };

            // Determine PDF orientation based on actual image dimensions (not padded canvas)
            // This ensures the page aspect ratio matches the image aspect ratio
            const imageAspectRatio = imageMetadata.imageWidth / imageMetadata.imageHeight;
            const pageOrientation = imageAspectRatio > 1 ? 'l' : 'p'; // landscape or portrait

            // Create PDF with appropriate page size
            const pdf = new this.jsPDFLib({
                orientation: pageOrientation,
                unit: 'mm',
                format: 'a4'
            });

            // Get page dimensions
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 12.7; // 0.5 inch margin on all sides (12.7mm = 0.5 inch)

            // Canvas has padding added during rendering to prevent circle clipping
            // We need to crop this padding out to get the actual circle artwork
            const autoScale = 2 * imageMetadata.maxRadius; // Default scale used in canvas.js
            const maxCircleExtent = (imageMetadata.maxRadius + imageMetadata.strokeWidth) * autoScale;
            const paddingPixels = Math.ceil(maxCircleExtent) + 50;

            // Create a cropped canvas that includes the circle artwork plus their radii
            // Circles at edges extend beyond their centers, so we need to account for that
            const croppedCanvas = document.createElement('canvas');
            const actualWidth = imageMetadata.imageWidth * autoScale;
            const actualHeight = imageMetadata.imageHeight * autoScale;

            // Include space for circle radius at edges so no circles are cut off
            const radiusMargin = Math.ceil(imageMetadata.maxRadius);
            const croppedWidth = actualWidth + (radiusMargin * 2);
            const croppedHeight = actualHeight + (radiusMargin * 2);

            croppedCanvas.width = croppedWidth;
            croppedCanvas.height = croppedHeight;

            const croppedCtx = croppedCanvas.getContext('2d');
            // Fill with white background
            croppedCtx.fillStyle = '#ffffff';
            croppedCtx.fillRect(0, 0, croppedWidth, croppedHeight);

            // Draw the circle area from the padded canvas, accounting for circle radius at edges
            // Start cropping from (paddingPixels - radiusMargin) to include circle edges
            croppedCtx.drawImage(
                canvas,
                paddingPixels - radiusMargin, paddingPixels - radiusMargin,  // source x, y
                croppedWidth, croppedHeight,                                  // source width, height
                0, 0,                                                         // dest x, y
                croppedWidth, croppedHeight                                   // dest width, height
            );

            // Calculate max available space on page with equal margins
            const maxWidth = pageWidth - (margin * 2);
            const maxHeight = pageHeight - (margin * 2);

            // Calculate scaling to fit on page while preserving aspect ratio
            // Reduce scale slightly (90%) to ensure there's room for centering
            let imgWidth = maxWidth * 0.9;
            let imgHeight = (croppedCanvas.height / croppedCanvas.width) * imgWidth;

            if (imgHeight > maxHeight * 0.9) {
                imgHeight = maxHeight * 0.9;
                imgWidth = (croppedCanvas.width / croppedCanvas.height) * imgHeight;
            }

            // Center image perfectly on page with equal margins on all 4 sides
            const x = margin + ((maxWidth - imgWidth) / 2);
            const y = margin + ((maxHeight - imgHeight) / 2);

            // Convert cropped canvas to image data (no padding)
            const imgData = croppedCanvas.toDataURL('image/png');

            alert('POSITIONING:\nX: ' + x.toFixed(2) + 'mm\nY: ' + y.toFixed(2) + 'mm\nWidth: ' + imgWidth.toFixed(2) + 'mm\nHeight: ' + imgHeight.toFixed(2) + 'mm\n\nPage: ' + pageWidth.toFixed(0) + 'x' + pageHeight.toFixed(0) + 'mm\nMargin: ' + margin.toFixed(2) + 'mm');

            // Add image to PDF at calculated position
            pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
            console.log('DEBUG 4: PDF internal state after addImage:', {
                currentPage: pdf.internal.getNumberOfPages(),
                pageSize: pdf.internal.pageSize.getWidth() + 'x' + pdf.internal.pageSize.getHeight()
            });

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
            console.error('PDF export error:', error);
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

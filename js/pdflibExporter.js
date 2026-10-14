/**
 * PDFLib Exporter - Uses PDFLib library for better PDF positioning control
 */

class PDFLibExporter {
    constructor() {
        // PDFLib is loaded from CDN
        this.PDFDocument = window.PDFLib?.PDFDocument;
        this.rgb = window.PDFLib?.rgb;
        this.pdfLibraryLoaded = this.PDFDocument !== undefined && this.rgb !== undefined;

        if (!this.pdfLibraryLoaded) {
            console.warn('[PDFLibExporter] PDFLib library not found');
        }
    }

    /**
     * Check if PDF library is available
     */
    isLibraryLoaded() {
        return this.pdfLibraryLoaded;
    }

    /**
     * Export circle visualization to PDF
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
                    message: 'PDFLib library not loaded. Cannot export to PDF.',
                };
            }

            const defaultOptions = {
                quality: 'standard',
                includeMetadata: false,
            };

            const finalOptions = { ...defaultOptions, ...options };

            // Determine PDF orientation based on actual image dimensions
            const imageAspectRatio = imageMetadata.imageWidth / imageMetadata.imageHeight;
            const isLandscape = imageAspectRatio > 1;

            // Create PDF document with appropriate page size
            const pdfDoc = await this.PDFDocument.create();

            // A4 dimensions in points (1 inch = 72 points, 1 mm = 2.834645669 points)
            const mmToPoints = 2.834645669;
            const pageWidthMm = 210;
            const pageHeightMm = 297;
            const pageWidthPts = pageWidthMm * mmToPoints;
            const pageHeightPts = pageHeightMm * mmToPoints;

            // Add page with appropriate orientation
            const page = pdfDoc.addPage([
                isLandscape ? pageHeightPts : pageWidthPts,
                isLandscape ? pageWidthPts : pageHeightPts
            ]);

            // Canvas has padding added during rendering to prevent circle clipping
            // We need to crop this padding out to get the actual circle artwork
            const autoScale = 2 * imageMetadata.maxRadius;
            const maxCircleExtent = (imageMetadata.maxRadius + imageMetadata.strokeWidth) * autoScale;
            const paddingPixels = Math.ceil(maxCircleExtent) + 50;

            // Create a cropped canvas that includes the circle artwork plus their radii
            const actualWidth = imageMetadata.imageWidth * autoScale;
            const actualHeight = imageMetadata.imageHeight * autoScale;

            // Include space for both radius and stroke width at edges
            const radiusMargin = Math.ceil(imageMetadata.maxRadius + imageMetadata.strokeWidth);
            const croppedWidth = actualWidth + (radiusMargin * 2);
            const croppedHeight = actualHeight + (radiusMargin * 2);

            const croppedCanvas = document.createElement('canvas');
            croppedCanvas.width = croppedWidth;
            croppedCanvas.height = croppedHeight;

            const croppedCtx = croppedCanvas.getContext('2d');
            // Fill with white background
            croppedCtx.fillStyle = '#ffffff';
            croppedCtx.fillRect(0, 0, croppedWidth, croppedHeight);

            // Draw the circle area from the padded canvas, accounting for circle radius at edges
            croppedCtx.drawImage(
                canvas,
                paddingPixels - radiusMargin, paddingPixels - radiusMargin,  // source x, y
                croppedWidth, croppedHeight,                                  // source width, height
                0, 0,                                                         // dest x, y
                croppedWidth, croppedHeight                                   // dest width, height
            );

            // Get the cropped canvas image as PNG
            const imageDataUrl = croppedCanvas.toDataURL('image/png');
            const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());
            const pngImage = await pdfDoc.embedPng(imageBytes);

            // Calculate image dimensions and position
            const margin = 2.54; // 0.1 inch margin on all sides
            const marginPts = margin * mmToPoints;

            const maxWidth = (isLandscape ? pageHeightPts : pageWidthPts) - (marginPts * 2);
            const maxHeight = (isLandscape ? pageWidthPts : pageHeightPts) - (marginPts * 2);

            // Calculate scaling to fit on page (all values in points)
            let imgWidth = maxWidth * 0.9;
            let imgHeight = (croppedHeight / croppedWidth) * imgWidth;

            if (imgHeight > maxHeight * 0.9) {
                imgHeight = maxHeight * 0.9;
                imgWidth = (croppedWidth / croppedHeight) * imgHeight;
            }

            // Calculate centered position (in points)
            const xPts = marginPts + ((maxWidth - imgWidth) / 2);
            const yPts = marginPts + ((maxHeight - imgHeight) / 2);

            // Draw white background
            page.drawRectangle({
                x: 0,
                y: 0,
                width: isLandscape ? pageHeightPts : pageWidthPts,
                height: isLandscape ? pageWidthPts : pageHeightPts,
                color: this.rgb(1, 1, 1),
            });

            // Draw the image at the calculated position
            // Note: PDFLib uses bottom-left origin, so we need to adjust Y
            const actualPageHeight = isLandscape ? pageWidthPts : pageHeightPts;
            const yFromBottom = actualPageHeight - yPts - imgHeight;

            page.drawImage(pngImage, {
                x: xPts,
                y: yFromBottom,
                width: imgWidth,
                height: imgHeight,
            });

            // Save and download
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            return {
                success: true,
                message: `PDF exported successfully: ${filename}`,
            };
        } catch (error) {
            console.error('PDFLib export error:', error);
            return {
                success: false,
                message: `PDF export failed: ${error.message}`,
            };
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFLibExporter;
}

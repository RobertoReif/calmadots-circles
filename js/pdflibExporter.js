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

            // Get the canvas image as PNG
            const imageDataUrl = canvas.toDataURL('image/png');
            const imageBytes = await fetch(imageDataUrl).then(res => res.arrayBuffer());
            const pngImage = await pdfDoc.embedPng(imageBytes);

            // Calculate image dimensions and position
            const margin = 12.7; // 0.5 inch
            const marginPts = margin * mmToPoints;

            const maxWidth = (isLandscape ? pageHeightPts : pageWidthPts) - (marginPts * 2);
            const maxHeight = (isLandscape ? pageWidthPts : pageHeightPts) - (marginPts * 2);

            // Get the actual canvas dimensions
            const autoScale = 2 * imageMetadata.maxRadius;
            const actualWidth = imageMetadata.imageWidth * autoScale;
            const actualHeight = imageMetadata.imageHeight * autoScale;
            const radiusMargin = Math.ceil(imageMetadata.maxRadius);
            const croppedWidth = actualWidth + (radiusMargin * 2);
            const croppedHeight = actualHeight + (radiusMargin * 2);

            // Calculate scaling to fit on page
            let imgWidth = maxWidth * 0.9;
            let imgHeight = (croppedHeight / croppedWidth) * imgWidth;

            if (imgHeight > maxHeight * 0.9) {
                imgHeight = maxHeight * 0.9;
                imgWidth = (croppedWidth / croppedHeight) * imgHeight;
            }

            // Convert points back to actual dimension for image
            const imgWidthPts = imgWidth * mmToPoints;
            const imgHeightPts = imgHeight * mmToPoints;

            // Calculate centered position
            const xPts = marginPts + ((maxWidth - (imgWidth * mmToPoints)) / 2);
            const yPts = marginPts + ((maxHeight - (imgHeight * mmToPoints)) / 2);

            console.log('PDFLib positioning:', {
                pageWidthPts, pageHeightPts,
                imgWidthPts, imgHeightPts,
                xPts, yPts
            });

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
            const yFromBottom = actualPageHeight - yPts - imgHeightPts;

            page.drawImage(pngImage, {
                x: xPts,
                y: yFromBottom,
                width: imgWidthPts,
                height: imgHeightPts,
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

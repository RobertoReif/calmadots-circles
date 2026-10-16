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
     * Export circle visualization to a US Letter PDF and download it
     * @param {HTMLCanvasElement} canvas - Finished circle canvas
     * @param {string} filename - Download filename
     */
    async exportToPDF(canvas, filename = 'circlesize.pdf') {
        try {
            if (!this.pdfLibraryLoaded) {
                return {
                    success: false,
                    message: 'PDF library not loaded. Please refresh the page.',
                };
            }

            // Snapshot the canvas before any await: orientation and pixels must come from the same render
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const isLandscape = canvasWidth > canvasHeight;
            const pngBlob = await new Promise((resolve, reject) => {
                canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))), 'image/png');
            });

            const pdfDoc = await this.PDFDocument.create();

            // US Letter in points (1 inch = 72 points), matching the crop aspect ratio
            const pageWidthPts = 8.5 * 72;
            const pageHeightPts = 11 * 72;

            // Add page with appropriate orientation
            const page = pdfDoc.addPage([
                isLandscape ? pageHeightPts : pageWidthPts,
                isLandscape ? pageWidthPts : pageHeightPts
            ]);

            // The circle canvas is rendered at its exact final size (edge margin included), so embed it as-is
            const pngImage = await pdfDoc.embedPng(await pngBlob.arrayBuffer());

            // Fit the artwork inside a 0.1 inch margin on all sides (all values in points)
            const marginPts = 0.1 * 72;
            const maxWidth = (isLandscape ? pageHeightPts : pageWidthPts) - (marginPts * 2);
            const maxHeight = (isLandscape ? pageWidthPts : pageHeightPts) - (marginPts * 2);

            const fitScale = Math.min(maxWidth / canvasWidth, maxHeight / canvasHeight);
            const imgWidth = canvasWidth * fitScale;
            const imgHeight = canvasHeight * fitScale;

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
            // Revoking immediately can cancel the download in Safari
            setTimeout(() => URL.revokeObjectURL(url), 1000);

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

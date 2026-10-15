/**
 * End-to-end checks for the CircleSize app, run against src/index.html in headless Chrome.
 * Run with scripts/run-tests.sh; results are written to <pre id="results">.
 */

// Headless Chrome doesn't fire animation frames reliably; renders are chunked on them
window.requestAnimationFrame = cb => setTimeout(cb, 0);

window.addEventListener('load', async () => {
    const log = [];
    const ok = (condition, message) => log.push((condition ? 'PASS ' : 'FAIL ') + message);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const app = window.app;

    // Wait until no render is in progress
    const idle = async () => {
        for (let i = 0; i < 400; i++) {
            await sleep(25);
            if (app.processingStatus.style.display === 'none') return true;
        }
        return false;
    };
    const setSlider = (slider, value) => {
        slider.value = value;
        slider.dispatchEvent(new Event('input'));
    };

    try {
        // Geometry: all-black 4x3 image, nothing clipped at any edge
        for (const fill of [false, true]) {
            const v = new CircleVisualizer();
            const processor = { getDimensions: () => ({ width: 4, height: 3 }), grayscaleData: new Uint8ClampedArray(4 * 3 * 4) };
            const c = document.createElement('canvas');
            await v.renderCircles(c, processor, null, fill);
            const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
            const dark = (x, y) => d[(y * c.width + x) * 4] < 128;
            let borderInk = false;
            for (let x = 0; x < c.width; x++) if (dark(x, 0) || dark(x, c.height - 1)) borderInk = true;
            for (let y = 0; y < c.height; y++) if (dark(0, y) || dark(c.width - 1, y)) borderInk = true;
            const { edgeMargin: m } = v.getLayout(4, 3);
            const r = v.config.maxRadius;
            const edgeInk = (dark(m - r, m) || dark(m - r + 1, m)) && (dark(c.width - 1 - (m - r), m) || dark(c.width - 1 - (m - r + 1), m));
            ok(!borderInk && edgeInk, `${fill ? 'fill' : 'stroke'}: edge circles drawn whole, none clipped`);
        }

        // Upload: 1500x1000, left half transparent, right half black
        const src = document.createElement('canvas');
        src.width = 1500; src.height = 1000;
        src.getContext('2d').fillRect(750, 0, 750, 1000);
        const blob = await new Promise(r => src.toBlob(r, 'image/png'));
        await app.handleImageUpload({ target: { files: [new File([blob], 'x.png', { type: 'image/png' })] } });
        ok(await idle(), 'first render finished: ' + app.uploadStatus.textContent);

        const ip = app.imageProcessor;
        ok(ip.currentWidth === 100 && ip.currentHeight === 67, `upload downsampled to ${ip.currentWidth}x${ip.currentHeight}`);
        let layout = app.visualizer.getLayout(ip.currentWidth, ip.currentHeight);
        ok(app.circleCanvas.width === layout.canvasWidth && app.circleCanvas.height === layout.canvasHeight,
            `canvas matches layout ${app.circleCanvas.width}x${app.circleCanvas.height}`);
        ok(ip.grayscaleData[0] === 255, `transparent pixel reads as white (${ip.grayscaleData[0]})`);

        // Rapid long-edge changes, then a config change mid-render: last values must win
        for (const value of [100, 150, 120]) {
            setSlider(app.longEdgeSlider, value);
            await sleep(5);
        }
        setSlider(app.maxRadiusSlider, 20);
        ok(await idle(), 'renders settled after rapid changes');
        layout = app.visualizer.getLayout(ip.currentWidth, ip.currentHeight);
        ok(ip.currentWidth === 120 && app.circleCanvas.width === layout.canvasWidth && layout.pitch === 40,
            `final canvas reflects last slider values: ${app.circleCanvas.width}x${app.circleCanvas.height}`);

        // Export: US Letter, artwork fills the page inside 0.1in margins
        let pdfBlob = null;
        const createObjectURL = URL.createObjectURL;
        URL.createObjectURL = b => { pdfBlob = b; return createObjectURL.call(URL, b); };
        await app.handleExport();
        URL.createObjectURL = createObjectURL;
        ok(!!pdfBlob, 'export produced a PDF: ' + app.exportStatus.textContent);
        if (pdfBlob) {
            const doc = await PDFLib.PDFDocument.load(await pdfBlob.arrayBuffer());
            const { width, height } = doc.getPage(0).getSize();
            ok(width === 792 && height === 612, `Letter landscape page ${width}x${height}`);
        }

        // Crop the right half; crop must come from the full-res source
        app.cropSelection = { startX: 60, startY: 0, endX: 120, endY: app.selectionCanvas.height };
        app.handleCrop('portrait');
        ok(ip.originalWidth >= 700, `crop from full-res source: ${ip.originalWidth}x${ip.originalHeight}`);
        ok(await idle(), 'crop render finished');

        // iOS canvas limit: long edge is lowered so the canvas stays under ~16.7M pixels
        Object.defineProperty(navigator, 'userAgent', { get: () => 'Mozilla/5.0 (iPhone)' });
        setSlider(app.maxRadiusSlider, 30);
        setSlider(app.longEdgeSlider, 500);
        ok(await idle(), 'iOS render finished');
        ok(app.circleCanvas.width * app.circleCanvas.height <= 16777216 && app.longEdgePixels < 500,
            `iOS long edge lowered to ${app.longEdgePixels}, canvas ${app.circleCanvas.width}x${app.circleCanvas.height}`);

        // A corrupt file reports an error instead of hanging
        await app.handleImageUpload({ target: { files: [new File([new Uint8Array([1, 2, 3])], 'bad.png', { type: 'image/png' })] } });
        ok(/Failed/.test(app.uploadStatus.textContent), 'bad file reports error: ' + app.uploadStatus.textContent);
    } catch (error) {
        log.push('ERROR ' + error.stack);
    }

    const results = document.createElement('pre');
    results.id = 'results';
    results.textContent = log.join('\n');
    document.body.appendChild(results);
});

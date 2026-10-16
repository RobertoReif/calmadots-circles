/**
 * End-to-end checks for the CircleSize app, run against src/index.html in headless Chrome.
 * Run with scripts/run-tests.sh; results are written to <pre id="results">.
 * Labels starting with "AC<n>" map to the acceptance criteria in spec.md §8.
 */

// Headless Chrome doesn't fire animation frames reliably; renders are chunked on them
window.requestAnimationFrame = cb => setTimeout(cb, 0);

// Under --virtual-time-budget, timers run ahead of real image decoding, so the app's
// 30s image-load timeout can fire before a test image decodes. Drop timers that long.
const realSetTimeout = window.setTimeout;
window.setTimeout = (cb, ms, ...args) => (ms >= 30000 ? 0 : realSetTimeout(cb, ms, ...args));

window.addEventListener('load', async () => {
    // Results are written as they happen so a hang still shows how far the run got
    const results = document.createElement('pre');
    results.id = 'results';
    document.body.appendChild(results);
    const record = line => { results.textContent += (results.textContent ? '\n' : '') + line; };
    const ok = (condition, message) => record((condition ? 'PASS ' : 'FAIL ') + message);
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const app = window.app;

    // Wait until no render is in progress (or an error is showing)
    const idle = async () => {
        for (let i = 0; i < 400; i++) {
            await sleep(25);
            if (app.processingStatus.style.display === 'none') return true;
            if (app.processingStatus.classList.contains('error')) return false;
        }
        return false;
    };
    const setSlider = (slider, value) => {
        slider.value = value;
        slider.dispatchEvent(new Event('input'));
    };
    const pngFile = async (canvas, name) => {
        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        return new File([blob], name, { type: 'image/png' });
    };
    const upload = file => app.handleImageUpload({ target: { files: [file] } });
    // Drag on the crop overlay with pointer events, in fractions of its on-screen size
    const drag = (from, to, pointerType = 'touch') => {
        const rect = app.selectionCanvas.getBoundingClientRect();
        const at = ([fx, fy]) => ({ clientX: rect.left + fx * rect.width, clientY: rect.top + fy * rect.height });
        const opts = { bubbles: true, pointerId: 7, pointerType, isPrimary: true };
        app.selectionCanvas.dispatchEvent(new PointerEvent('pointerdown', { ...opts, ...at(from) }));
        app.selectionCanvas.dispatchEvent(new PointerEvent('pointermove', { ...opts, ...at(to) }));
        app.selectionCanvas.dispatchEvent(new PointerEvent('pointerup', { ...opts, ...at(to) }));
    };
    const selectionRatio = () => {
        const s = app.cropSelection;
        return Math.abs(s.endX - s.startX) / Math.abs(s.endY - s.startY);
    };
    const exportPdf = async () => {
        let pdfBlob = null;
        const createObjectURL = URL.createObjectURL;
        URL.createObjectURL = b => { pdfBlob = b; return createObjectURL.call(URL, b); };
        await app.handleExport();
        URL.createObjectURL = createObjectURL;
        if (!pdfBlob) return null;
        const doc = await PDFLib.PDFDocument.load(await pdfBlob.arrayBuffer());
        return doc.getPage(0).getSize();
    };

    try {
        ok(!document.getElementById('includeMetadata'), 'metadata checkbox removed');

        // AC2: all-black 4x3 image, every edge circle drawn whole, nothing touches the border
        for (const [label, strokeWidth, fill] of [['stroke 2', 2, false], ['stroke 3', 3, false], ['fill', 2, true]]) {
            const v = new CircleVisualizer();
            v.updateConfig({ strokeWidth });
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
            const near = (x, y) => dark(x, y) || dark(x + 1, y) || dark(x - 1, y) || dark(x, y + 1) || dark(x, y - 1);
            const right = c.width - 1 - m, bottom = c.height - 1 - m;
            const edges = near(m - r, m) && near(m, m - r) && near(right + r, bottom) && near(right, bottom + r);
            ok(!borderInk && edges, `AC2 ${label}: edge circles whole on all four sides, none clipped`);
        }

        // AC2: at the default min radius 0, white pixels draw nothing
        {
            const v = new CircleVisualizer();
            const processor = { getDimensions: () => ({ width: 4, height: 3 }), grayscaleData: new Uint8ClampedArray(4 * 3 * 4).fill(255) };
            const c = document.createElement('canvas');
            await v.renderCircles(c, processor);
            const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
            ok(v.config.minRadius === 0 && d.every(value => value === 255), 'AC2 white pixels draw no circle at min radius 0');
        }

        // Upload: 1500x1000, left half transparent, right half black
        const src = document.createElement('canvas');
        src.width = 1500; src.height = 1000;
        src.getContext('2d').fillRect(750, 0, 750, 1000);
        await upload(await pngFile(src, 'x.png'));
        ok(await idle(), 'first render finished: ' + app.uploadStatus.textContent);

        const ip = app.imageProcessor;
        ok(ip.currentWidth === 100 && ip.currentHeight === 67, `AC1 upload downsampled to ${ip.currentWidth}x${ip.currentHeight}`);
        ok(app.circleCanvas.width === 3004 && app.circleCanvas.height === 2014,
            `AC1 canvas is 3004x2014 per spec formula: ${app.circleCanvas.width}x${app.circleCanvas.height}`);
        ok(ip.grayscaleData[0] === 255, `AC3 transparent pixel reads as white (${ip.grayscaleData[0]})`);
        ok(app.grayscaleCanvas.width === 1500 && app.grayscaleCanvas.height === 1000,
            `preview at full resolution: ${app.grayscaleCanvas.width}x${app.grayscaleCanvas.height}`);

        // AC4: a newer render cancels an older one
        const first = app.visualizer.renderCircles(document.createElement('canvas'), ip);
        const second = app.visualizer.renderCircles(document.createElement('canvas'), ip);
        ok((await first) === false && (await second) === true, 'AC4 older render is cancelled by a newer one');

        // AC4: rapid long-edge changes, then a config change mid-render: last values win
        for (const value of [150, 200, 120]) {
            setSlider(app.longEdgeSlider, value);
            await sleep(1);
        }
        setSlider(app.maxRadiusSlider, 20);
        ok(app.exportButton.disabled, 'AC5 export disabled while rendering');
        ok(await idle(), 'renders settled after rapid changes');
        ok(!app.exportButton.disabled, 'export enabled after render completes');
        ok(ip.currentWidth === 120 && ip.currentHeight === 80 && app.circleCanvas.width === 4804 && app.circleCanvas.height === 3204,
            `AC4 final canvas reflects last slider values: ${app.circleCanvas.width}x${app.circleCanvas.height}`);

        // AC14: brightness and contrast change the grid and the preview, and keep the crop selection
        const grid = () => Array.from(ip.grayscaleData.filter((_, i) => i % 4 === 0));
        const previewPixel = (fx) => app.grayscaleCanvas.getContext('2d').getImageData(Math.floor(fx * app.grayscaleCanvas.width), 0, 1, 1).data[0];
        drag([0.5, 0], [1, 1], 'mouse');
        const selectionBefore = JSON.stringify(app.cropSelection);
        setSlider(app.brightnessSlider, 100);
        ok(await idle() && grid().every(g => g === 255) && previewPixel(0.9) === 255,
            'AC14 brightness 100 turns the grid and preview white');
        setSlider(app.brightnessSlider, -100);
        ok(await idle() && grid().every(g => g === 0), 'AC14 brightness -100 turns the grid black');
        setSlider(app.brightnessSlider, 0);
        setSlider(app.contrastSlider, -100);
        ok(await idle() && grid().every(g => g === 128), 'AC14 contrast -100 flattens the grid to mid-gray');
        setSlider(app.contrastSlider, 0);
        ok(await idle() && grid().some(g => g === 0) && grid().some(g => g === 255) && JSON.stringify(app.cropSelection) === selectionBefore,
            'AC14 back to 0 restores the grid and keeps the crop selection');

        // AC5: landscape image exports a landscape Letter page
        let page = await exportPdf();
        ok(page && page.width === 792 && page.height === 612, `AC5 Letter landscape page ${page && page.width}x${page && page.height}`);

        // Crop selection by touch drag, constrained to the portrait ratio
        drag([0.5, 0], [1, 1]);
        ok(Math.abs(selectionRatio() - 8.5 / 11) < 0.02, `AC6 touch drag makes a portrait selection (ratio ${selectionRatio().toFixed(3)})`);

        // Switching orientation reshapes the existing selection
        document.querySelector('input[name="cropOrientation"][value="landscape"]').click();
        ok(Math.abs(selectionRatio() - 11 / 8.5) < 0.02, `AC6 orientation switch reshapes selection (ratio ${selectionRatio().toFixed(3)})`);
        document.querySelector('input[name="cropOrientation"][value="portrait"]').click();

        // AC6: crop comes from the full-res source
        drag([0.5, 0], [1, 1]);
        app.handleCrop('portrait');
        ok(ip.originalWidth >= 700 && Math.abs(ip.originalWidth / ip.originalHeight - 8.5 / 11) < 0.01,
            `AC6 crop from full-res source with portrait ratio: ${ip.originalWidth}x${ip.originalHeight}`);
        ok(await idle(), 'crop render finished');

        // AC5: after cropping to portrait, the PDF page follows the rendered canvas
        page = await exportPdf();
        ok(page && page.width === 612 && page.height === 792, `AC5 portrait crop exports a portrait page ${page && page.width}x${page && page.height}`);

        // Circle color: circles are drawn in the picked color; reset restores black
        app.circleColorPicker.value = '#ff0000';
        app.circleColorPicker.dispatchEvent(new Event('input'));
        ok(await idle(), 'color render finished');
        const px = app.circleCanvas.getContext('2d').getImageData(0, 0, app.circleCanvas.width, app.circleCanvas.height).data;
        let red = 0, black = 0;
        for (let i = 0; i < px.length; i += 4) {
            if (px[i] > 200 && px[i + 1] < 60 && px[i + 2] < 60) red++;
            if (px[i] < 60 && px[i + 1] < 60 && px[i + 2] < 60) black++;
        }
        ok(red > 0 && black === 0, `AC10 circles drawn in picked color (red px: ${red}, black px: ${black})`);
        await app.resetToDefaults();
        ok(await idle() && app.circleColorPicker.value === '#000000', 'AC10 reset restores black');

        // A render error keeps the progress bar; the next render recovers
        const renderCircles = app.visualizer.renderCircles;
        app.visualizer.renderCircles = () => Promise.reject(new Error('simulated'));
        await app.renderCircles();
        app.visualizer.renderCircles = renderCircles;
        ok(/Rendering error: simulated/.test(app.processingText.textContent) && document.getElementById('progressFill'),
            'AC11 render error shown without removing the progress bar');
        await app.renderCircles();
        ok(app.processingStatus.style.display === 'none' && !app.processingStatus.classList.contains('error'), 'AC11 next render recovers after an error');

        // AC7: iOS canvas limit lowers the long edge and shows a notice
        Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => 'Mozilla/5.0 (iPhone)' });
        setSlider(app.maxRadiusSlider, 30);
        setSlider(app.longEdgeSlider, 500);
        ok(await idle(), 'iOS render finished');
        const { width: cw, height: ch } = app.circleCanvas;
        ok(cw * ch <= 16777216 && cw <= 16384 && ch <= 16384 && app.longEdgePixels < 500 && /lowered/.test(app.cropStatus.textContent),
            `AC7 iOS long edge lowered to ${app.longEdgePixels}, canvas ${cw}x${ch}, notice: "${app.cropStatus.textContent}"`);
        delete navigator.userAgent;

        // A large upload is downsampled to a 2000px long edge, not rejected
        const big = document.createElement('canvas');
        big.width = 4000; big.height = 3000;
        big.getContext('2d').fillRect(0, 0, 2000, 3000);
        await upload(await pngFile(big, 'big.png'));
        ok(await idle(), 'large upload render finished: ' + app.uploadStatus.textContent);
        ok(ip.originalWidth === 2000 && ip.originalHeight === 1500 && app.grayscaleCanvas.width === 2000,
            `AC9 large upload downsampled to ${ip.originalWidth}x${ip.originalHeight}: ${app.metaDimensions.textContent}`);

        // AC8: a corrupt file reports an error and the app stays usable
        await upload(new File([new Uint8Array([1, 2, 3])], 'bad.png', { type: 'image/png' }));
        ok(/Failed to load image/.test(app.uploadStatus.textContent), 'AC8 bad file reports error: ' + app.uploadStatus.textContent);
        await upload(await pngFile(src, 'again.png'));
        ok(await idle() && ip.originalWidth === 1500, 'AC8 a valid upload works after the error');
        record('DONE');
    } catch (error) {
        record('ERROR ' + error.stack);
    }
});

# CircleSize - Project Specification

**Repository**: [RobertoReif/calmadots-circles](https://github.com/RobertoReif/calmadots-circles)

## 1. Project Overview

CircleSize is a web-based image processing tool that converts uploaded images into stunning circle-based visualizations. Each sampled pixel becomes a circle whose size correlates to the pixel's darkness — darker pixels render as larger circles, creating an artistic stippled effect.

The app runs entirely in the browser (no backend), is deployable to GitHub Pages, and follows a minimal, professional design aesthetic inspired by [Roberto Reif's style guide](./robertoreif-style-guide.md).

## 2. Core Features

Terms: the **source image** is the upload (capped at 2000 px on its long edge) or the latest crop of it. The **grid** is the source downsampled to the long-edge setting; one grid pixel becomes one circle. **px** means canvas pixels of the rendered circle image unless stated otherwise. PDF measurements are in points (72 pt = 1 inch).

### Image Upload & Processing
- Accept JPG, PNG, WebP and GIF (first frame only). Other types, including SVG, are rejected with an error.
- Images smaller than 10×10 are rejected with an error. Images whose long edge exceeds 2000 px are downsampled (aspect ratio preserved) so the long edge is 2000 px; this is the source image for the preview and crop. The metadata shows both the uploaded and downsampled dimensions.
- A file that fails to load or decode shows an error within 30 s, and the app stays usable. Choosing the same file again reloads it (this is also how to undo a crop).
- Show image metadata after upload: filename, original dimensions, file size.
- Convert to grayscale with `gray = round(0.299*R + 0.587*G + 0.114*B)`. Transparent pixels are composited onto white first, so they read as white.

### Crop (US Letter)
- The preview shows the source image in grayscale at its own resolution, scaled to 500 px on its long edge on screen.
- The user drags a selection on the preview with mouse, touch or pen, and chooses **portrait (8.5:11)** or **landscape (11:8.5)**. The selection is constrained to that ratio while dragging, and switching orientation reshapes an existing selection to the new ratio.
- The crop is taken from the source image, never from the grid. A crop smaller than the long-edge setting is upsampled to it.
- Clicking Crop with no selection shows "Please select a crop area by dragging on the image"; a zero-size selection shows "Crop error: Crop selection is too small".
- Cropping is optional. Without a crop, the whole image is used and the PDF still fits it on a Letter page (see Export).

### Resolution (Long Edge)
- A **long edge** slider sets how many source pixels the image is downsampled to on its longer side: range 10–500, step 5, **default 100**. Aspect ratio is preserved; the short side is rounded to the nearest pixel (minimum 1).
- The long edge applies immediately after upload, after a crop and whenever the slider moves.
- **Canvas limit:** if the resulting circle canvas would exceed the browser's canvas limit, the long edge is lowered in steps of 5 (not below 10) until it fits, the slider updates, and a notice appears in the Step 2 status area. The long edge is not raised again automatically when a later change would fit; the user can move the slider back up. At the defaults (about 3,000×2,000 px for a 3:2 image) the canvas fits the iOS limit; larger max radius or long edge values can trigger it. Limits: iOS/iPadOS 16,777,216 px area and 16,384 px per side; other browsers 268,435,456 px area and 32,767 px per side.

### Circle Visualization
- **Placement:** circle centers sit on a grid with pitch `P = 2 × max_radius` px. Source pixel (x, y) is drawn at `(x·P + m, y·P + m)`, where the edge margin `m = ceil(max_radius + max(1, stroke_width)/2) + 1`.
- **Canvas size:** `((W−1)·P + 2m) × ((H−1)·P + 2m)` for a W×H source image. No circle is clipped at any edge.
- **Sizing formula:**
  ```
  normalized_darkness = (255 - pixel_grayscale_value) / 255
  circle_radius = min_radius + (normalized_darkness * (max_radius - min_radius))
  ```
  - Black (0) → `max_radius`; mid-gray (127) → about halfway; white (255) → `min_radius`.
  - Circles with radius < 0.5 px are not drawn. With the default min radius 0, white and near-white pixels leave blank space.
  - Because the pitch is `2 × max_radius`, the largest filled circles touch their neighbours. In outline mode the outlines of the largest neighbouring circles overlap by up to `stroke_width` px. The ranges below keep min radius below max radius.
- **Stroke:** `stroke = max(1, normalized_darkness × stroke_width)` px, so lighter circles get thinner outlines (minimum 1 px).
- **Style:** outline on a white background by default. A **Fill circles** checkbox draws solid circles instead (no stroke).
- **Color:** a **Circle color** picker (default black, `#000000`) sets the color of both the outline and the fill. The background stays white.
- **Spacing:** samples every `(spacing + 1)`th source pixel in each direction. 0 = every pixel; 2 = every 3rd pixel. Skipped pixels leave empty grid cells, so spacing adds gaps of `spacing × P` px. The UI labels spacing in px, but it is a sampling stride. When `(W−1)` is not a multiple of `spacing + 1`, the last sampled column (or row) sits short of the canvas edge, leaving extra white space on the right (or bottom).
- **Configurable parameters:**

  | Parameter | Range | Step | Default |
  |---|---|---|---|
  | Min circle radius | 0–5 px | 1 | 0 |
  | Max circle radius | 10–30 px | 1 | 15 |
  | Stroke width | 1–3 px | 0.5 | 2 |
  | Spacing | 0–5 | 1 | 0 |
  | Long edge | 10–500 source px | 5 | 100 |

  A **Reset** button restores the circle defaults (radius, stroke, spacing, color). It does not change the long edge, the fill setting or the crop.
- **Responsiveness:** any change re-renders. A change made while a render is in progress cancels that render and starts a new one with the latest settings; the displayed image is always a complete render. If a render fails, the error appears in the Step 4 status area and the next change renders normally.

### Export to PDF
- **Library:** pdf-lib 1.17.1, loaded from cdnjs.
- **Page:** one US Letter page, 612×792 pt. Landscape (792×612) when the rendered circle canvas is wider than tall; otherwise portrait.
- **When:** the Download button is disabled while a render is in progress, so the export always matches the displayed render.
- **Placement:** the circle canvas is embedded as a single PNG, scaled uniformly to the largest size that fits inside a **0.1 in (7.2 pt) margin** on every side, and centered.
- **Resolution:** the embedded image keeps the canvas's full pixel size. At the defaults (long edge 100, max radius 15) the canvas is about 3,000 px on its long side, roughly 280 dpi on the limiting side (10.8 in for a 3:2 image).
- **Filename:** `<original name without extension>-circles.pdf`.
- **No metadata:** the PDF contains only the artwork; no document properties are written.
- **Offline:** not supported. If pdf-lib cannot load, Download shows "PDF library not loaded. Please refresh the page."

## 3. Design & UI Guidelines

Following [Roberto Reif's style guide](./robertoreif-style-guide.md) for a minimal, professional aesthetic:

### Color Palette
- **Background**: `#ffffff` (white) — clean, uncluttered
- **Text Primary**: `#1a1a1a` (dark) — headings and main content
- **Text Secondary**: `#666666` (medium gray) — supporting labels, hints
- **Text Tertiary**: `#999999` (light gray) — metadata, placeholders
- **Accent**: `#0077B5` (LinkedIn blue) — buttons, interactive elements, highlights
- **Borders**: `#e0e0e0` (light gray) — subtle dividers

### Typography
- **Font Stack**: System fonts (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`)
- **Monospace**: `'Courier New', monospace` for technical values
- **Headings**: 400 weight, up to 2rem on desktop
- **Body Text**: 1rem, line-height 1.6, weight 300-400
- **Color**: `#333333` for body, `#1a1a1a` for headings

### Layout & Spacing
- **Desktop**: Max-width 1000px, 80px padding, centered
- **Mobile**: 20-40px padding, single column
- **Section Spacing**: 40-60px between major sections
- **Component Gaps**: 20-40px for form elements
- **Vertical Rhythm**: Multiples of 10px or 20px

### Interactive Elements
- **Links**: Blue (`#0077B5`) with smooth 0.3s hover transition
- **Buttons**: Dark background (`#333333`), white text, subtle hover effect
- **Forms**: Clean minimal styling, subtle borders (`#e0e0e0`), focus states
- **Shadows**: Minimal (`0 2px 8px rgba(0,0,0,0.1)`) for subtle depth only

### Responsive Design
- **Mobile Breakpoint**: ≤640px (adjusted spacing)
- **Desktop Breakpoint**: >1024px (full layout, expanded controls)
- **Touch-Friendly**: Minimum 44px tap targets for buttons
- **Images**: Flexible scaling, preserved aspect ratios

---

## 4. Technical Architecture

### Frontend Stack
- **Framework**: Vanilla JavaScript, no build step
- **Image Processing**: Canvas API
- **PDF Generation**: pdf-lib (CDN)
- **Styling**: Plain CSS
- **Deployment**: GitHub Pages serving `docs/`, which is a copy of `src/index.html`, `js/` and `css/` made by `scripts/sync-docs.sh`

### Modules
```
js/app.js             CircleSizeApp: UI wiring, crop selection, render scheduling, canvas-limit check
js/imageProcessor.js  ImageProcessor: load/validate, crop (full-res), downsample + grayscale
js/canvas.js          CircleVisualizer: layout geometry, cancellable chunked circle rendering
js/pdflibExporter.js  PDFLibExporter: Letter page layout and PNG embedding
```

## 5. User Workflow

1. **Upload** → select or drop an image; it is downsampled to the long edge and rendered
2. **Preview & crop** (optional) → drag a selection, choose portrait or landscape, crop
3. **Configure** → adjust radius, stroke, spacing, color, long edge; toggle fill in step 4
4. **Visualize** → circle image updates after each change
5. **Export** → download the Letter PDF

## 6. Technical Considerations

| Aspect | Decision |
|--------|----------|
| **Processing** | Canvas API on the main thread; rendering is chunked (50 sampled rows per animation frame) to keep the UI responsive |
| **Storage** | Client-side only; nothing is uploaded or stored |
| **PDF Rendering** | Rasterized PNG in a pdf-lib document (vector circles would make very large files) |
| **Browser Support** | Current Chrome, Firefox, Safari (macOS and iOS), Edge |

## 7. Constraints & Notes

- **GitHub Pages**: pure static files.
- **Performance targets** (desktop Chrome on a recent laptop, defaults, 1000×1000 upload): first render under 3 s; PDF export under 3 s. Not yet measured.
- **File size target**: under 10 MB for a default-settings export. Not yet measured.
- **Mobile**: iOS canvas limits cap the long edge (see Resolution). Large canvases use a lot of memory; very large photos may fail to decode on low-memory phones.

### Error Messages
| Situation | Message (where) |
|---|---|
| Unsupported type | "Unsupported format. Supported: JPG, PNG, WebP, GIF" (Step 1) |
| Under 10×10 | "Image too small (W×Hpx). Minimum: 10×10px" (Step 1) |
| Corrupt / undecodable | "Failed to load image. File may be corrupted or has CORS restrictions." (Step 1) |
| Load exceeds 30 s | "Image loading timed out. File may be too large or network issue." (Step 1) |
| Render failure | "Rendering error: …" (Step 4) |
| pdf-lib missing | "PDF library not loaded. Please refresh the page." (Step 5) |

### Accessibility (not yet verified)
- Every control has a visible label; all controls are reachable and usable by keyboard (crop selection is pointer-only).
- Focus states are visible.
- Status messages should be announced to screen readers (`aria-live`); not yet implemented.

## 8. Acceptance Criteria

Automated checks live in `test/app.test.js` (run `scripts/run-tests.sh`); their result labels start with the criterion number. The rest are manual.

1. **Upload downsampling:** given a 1500×1000 PNG uploaded with defaults, the grid is 100×67 and the circle canvas is exactly 3004×2014. *(automated)*
2. **No clipping:** given an all-black 4×3 image, the outermost circles on all four sides are drawn whole and no ink touches the canvas border, at stroke 2, stroke 3 and in fill mode. Given an all-white image at the default min radius 0, nothing is drawn. *(automated)*
3. **Transparency:** a fully transparent pixel has grayscale 255. *(automated)*
4. **Latest settings win:** starting a render cancels any render in progress; after rapid long-edge changes and a max-radius change mid-render, the final canvas matches the last values (4804×3204 for long edge 120, max radius 20). *(automated)*
5. **PDF page:** a landscape render exports one 792×612 pt page; after a portrait crop, the export is 612×792 pt. Download is disabled while a render runs. *(automated)* The artwork is centered with 7.2 pt margins on the limiting sides. *(manual)*
6. **Crop:** a touch drag produces a selection with the chosen ratio; switching orientation reshapes it; cropping the right half of a 1500×1000 upload yields an 8.5:11 crop at least 700 px wide, taken from the source. *(automated)* Selection follows the finger on a real phone. *(manual)*
7. **Canvas limit:** on iOS with max radius 30 and long edge 500, the long edge is lowered, the canvas is ≤ 16,777,216 px and ≤ 16,384 px per side, and the notice is shown. *(automated with a spoofed user agent; verify on a real device)*
8. **Bad files:** a corrupt PNG shows "Failed to load image…", and a valid upload afterwards works. *(automated)*
9. **Large uploads:** a 4000×3000 upload becomes a 2000×1500 source and the metadata shows both sizes. *(automated)*
10. **Color and reset:** picking a color draws every circle in it; Reset restores black. *(automated)*
11. **Render errors:** a failed render shows "Rendering error: …" with the progress bar intact, and the next render succeeds. *(automated)*
12. **Viewers:** the exported PDF opens correctly in Preview, Chrome and Adobe Reader. *(manual)*
13. **Performance:** with defaults and a 1000×1000 upload on desktop Chrome, the first render and the PDF export each finish in under 3 s, and the PDF is under 10 MB. *(manual, not yet measured)*

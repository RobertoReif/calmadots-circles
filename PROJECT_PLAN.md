# CircleSize - Project Implementation Plan

**Last updated**: 2026-10-15. See [spec.md](./spec.md) for intended behavior.

Status key: ✅ done · 🔶 in progress / partly done · ⬜ not started

---

## Status at a Glance

| Phase | Status | Notes |
|-------|--------|-------|
| 0. Technical spike (PDF) | ✅ | Superseded: final library is pdf-lib (see Decisions) |
| 1. Project setup | ✅ | `src/`, `js/`, `css/`, `docs/` for Pages |
| 2. Upload & grayscale | ✅ | Includes transparency → white, corrupt-file errors |
| 3. Resizing (long edge) | ✅ | Long-edge slider, default 100; canvas-limit check |
| 3b. Crop (US Letter) | ✅ | Full-res crop; overlay misaligned on narrow screens (see Remaining) |
| 4. Circle visualization | ✅ | Grid layout, cancellable chunked render, fill toggle |
| 5. PDF export | 🔶 | Letter page with 0.1in margins works; metadata not implemented; viewer/browser testing not done |
| 6. UI/UX & responsiveness | 🔶 | Styled per style guide; mobile layout not verified |
| 7. Testing, docs & deployment | 🔶 | Deployed to Pages; automated tests and README done; cross-browser testing not done |

---

## Phase 0: Technical Spike ✅
- ✅ Prototype circles on Canvas embedded as a PNG in a PDF
- ✅ Findings recorded in [TECHNICAL_SPIKE.md](./TECHNICAL_SPIKE.md) (historical; its jsPDF/SimplePdfGenerator conclusion was later replaced)

## Phase 1: Project Setup ✅
- ✅ Directory structure, HTML boilerplate, base CSS from the style guide
- ✅ Modules: `app.js`, `imageProcessor.js`, `canvas.js`, `pdflibExporter.js`
- ✅ GitHub Pages serving `docs/`

## Phase 2: Image Upload & Processing ✅
- ✅ File input with drag and drop; JPG/PNG/WebP/GIF only
- ✅ Reject images outside 10×10 – 2000×2000
- ✅ Grayscale `0.299R + 0.587G + 0.114B`; transparent pixels composited onto white
- ✅ Metadata display (filename, dimensions, size)
- ✅ Load/decode failures show an error instead of hanging
- **Done when:** acceptance criteria 1, 3 and 8 in the spec pass

## Phase 3: Resizing & Crop ✅
- ✅ Long-edge slider (10–500, step 5, default 100), applied on upload, crop and slider change
- ✅ Canvas-limit check lowers the long edge with a notice (iOS 16.7M px; others 268M px / 32,767 px side)
- ✅ Crop selection constrained to 8.5:11 or 11:8.5, taken from the full-resolution source
- **Done when:** acceptance criteria 6 and 7 pass

## Phase 4: Circle Visualization ✅
- ✅ Radius formula and adaptive stroke (`max(1, darkness × stroke)`, no rounding)
- ✅ Grid pitch `2 × max_radius`, edge margin so no circle is clipped
- ✅ Chunked rendering off-screen; a newer render cancels an older one
- ✅ Controls: min/max radius, stroke, spacing, reset, fill toggle
- ⬜ Remember last-used settings in localStorage (optional)
- **Done when:** acceptance criteria 2 and 4 pass

## Phase 5: PDF Export 🔶
- ✅ pdf-lib, US Letter, orientation from image shape, 0.1in margin, centered
- ✅ Single crop/geometry source: the exporter embeds the canvas as rendered
- ⬜ Implement or remove the "Include metadata" checkbox (spec: document properties)
- ⬜ Check PDFs in Preview, Chrome, Adobe Reader (criterion 9)
- ⬜ Measure export time and file size at defaults against spec targets (<3 s, <10 MB)
- **Done when:** acceptance criteria 5 and 9 pass and targets are measured

## Phase 6: UI/UX & Responsiveness 🔶
- ✅ Colors, typography and layout from the style guide
- ⬜ Fix crop overlay on narrow screens: `.selection-canvas` has no `max-width`, so it is larger than and misaligned with the preview when the container is narrower than 500px
- ⬜ Verify layout at ≤640px, 641–1024px, >1024px
- ⬜ Touch support for crop selection (currently mouse events only)
- **Done when:** crop selection lines up with the pointer at any window width, on desktop and touch

## Phase 7: Testing, Documentation & Deployment 🔶
- ✅ Deployed via GitHub Pages from `docs/`
- ✅ `scripts/sync-docs.sh` mirrors `src/index.html`, `js/`, `css/` into `docs/`; `--check` verifies
- ✅ Automated end-to-end checks: `scripts/run-tests.sh` (headless Chrome, `test/app.test.js`)
- ⬜ Cross-browser manual pass: Chrome, Firefox, Safari (macOS + real iOS device), Edge
- ✅ README updated for pdf-lib, Letter, crop and scripts
- ⬜ Accessibility pass: keyboard navigation, contrast, Lighthouse
- **Done when:** all spec acceptance criteria pass and the manual pass has no open issues

---

## Remaining Work (in order)

1. Crop overlay on narrow screens + touch selection (Phase 6)
2. Decide and implement or remove the metadata checkbox (Phase 5)
3. Manual browser and PDF viewer pass, including a real iPhone/iPad (Phases 5, 7)
4. Measure render/export time and PDF size at defaults (Phase 5)

## Release Checklist

Before pushing to `master` (which deploys Pages):
1. `scripts/sync-docs.sh` (then `--check`)
2. Bump the `?v=` query on the script tags in `src/index.html` if any JS changed, then sync again
3. `scripts/run-tests.sh` passes
4. No `console.log` left in `js/`

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Markup** | HTML5 |
| **Styling** | Plain CSS, system fonts |
| **Image Processing** | Canvas API (main thread, chunked) |
| **PDF Export** | pdf-lib 1.17.1 from cdnjs, PNG embedding |
| **Testing** | Headless Chrome via `scripts/run-tests.sh` |
| **Deployment** | GitHub Pages from `docs/` |
| **Build Tools** | None |

## Key Technical Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-10-11 | Vanilla JS, no build step | Small app; static hosting |
| 2026-10-11 | Rasterized PDF, not vector circles | Vector output would be very large; consistent across viewers |
| 2026-10-11 | Spike chose a custom SimplePdfGenerator after jsPDF failed to load | Superseded below |
| 2026-10-13 | Switched to jsPDF, then to **pdf-lib** | pdf-lib gave precise placement in points; jsPDF and SimplePdfGenerator removed 2026-10-15 |
| 2026-10-15 | **US Letter** page (was A4) | Matches the 8.5:11 crop ratio, so margins are even |
| 2026-10-15 | Canvas sized exactly to the artwork; no padding/crop step | The exporter cropped an already-cropped canvas, shifting and clipping the PDF |
| 2026-10-15 | Default long edge 250 with an automatic canvas-limit cap | More detail by default without blank canvases on iOS |
| 2026-10-15 | Defaults changed to min radius 5, max radius 30, long edge 100 | Requested by the project owner |
| 2026-10-15 | Cancel stale renders instead of Web Workers | Fixes dropped/mixed slider updates; workers not needed at current sizes |

## Risks

| Risk | Mitigation |
|------|-----------|
| **Browser canvas size limits** (blank canvas) | Long edge lowered automatically; limits are hard-coded per platform and need checking on real devices |
| **Large canvas memory / slow render** | Default canvas ≈ 7,500 px long side; measure on mid-range laptop and phone (Remaining #4) |
| **Unit conversions** (source px → canvas px → PDF pt) | One geometry function (`CircleVisualizer.getLayout`); exporter only scales the finished canvas; covered by tests |
| **`docs/` drifting from source** | `scripts/sync-docs.sh --check` in the release checklist |
| **Stale JS cached on Pages** | `?v=` cache-busting bump in the release checklist |
| **pdf-lib CDN unavailable** | Export shows "PDF library not loaded"; consider vendoring if this occurs |

## Known Constraints & Limitations

- Static files only (GitHub Pages)
- Max upload 2000×2000; larger images are rejected, not downsampled
- GIFs use the first frame; SVG is not supported
- PDF contains a raster image, not vector circles

## Future Enhancements (Post-MVP)

- Custom circle colors
- Other shape modes (dots, dashes)
- Settings presets / remember last settings
- Undo/redo
- Batch export
- PWA offline support

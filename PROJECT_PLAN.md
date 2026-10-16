# CircleSize - Project Implementation Plan

**Last updated**: 2026-10-16. See [spec.md](./spec.md) for intended behavior; "AC n" below refers to its §8 acceptance criteria.

Status key: ✅ done · 🔶 in progress / partly done · ⬜ not started

---

## Status at a Glance

| Phase | Status | Notes |
|-------|--------|-------|
| 0. Technical spike (PDF) | ✅ | Superseded: final library is pdf-lib (see Decisions) |
| 1. Project setup | ✅ | `src/`, `js/`, `css/`, `docs/` for Pages |
| 2. Upload & grayscale | ✅ | Transparency → white, >2000px downsampled, corrupt-file errors |
| 3. Resizing & crop | ✅ | Long edge (default 100), canvas-limit cap, touch-capable crop; narrow-screen overlay still open (Phase 6) |
| 4. Circle visualization | ✅ | Grid layout, cancellable chunked render, fill toggle, color picker |
| 5. PDF export | 🔶 | Letter, 0.1in margin, disabled during renders; viewer testing and measurements not done |
| 6. UI/UX & responsiveness | 🔶 | Styled per style guide; narrow-screen crop overlay broken; mobile layout not verified |
| 7. Testing, docs & deployment | 🔶 | Deployed; automated tests (AC 1–11) and docs current; cross-browser/real-device pass not done |

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
- ✅ Reject images under 10×10; downsample uploads with a long edge over 2000px to 2000px
- ✅ Grayscale `0.299R + 0.587G + 0.114B`; transparent pixels composited onto white
- ✅ Metadata display (filename, uploaded and downsampled dimensions, size)
- ✅ Load/decode failures show an error and the app stays usable; the same file can be chosen again
- **Done when:** AC 1, 3, 8 and 9 pass (automated)

## Phase 3: Resizing & Crop ✅
- ✅ Long-edge slider (10–500, step 5, default 100), applied on upload, crop and slider change
- ✅ Canvas-limit check lowers the long edge with a notice (iOS 16.7M px / 16,384 px side; others 268M px / 32,767 px side)
- ✅ Full-resolution grayscale preview
- ✅ Crop selection with Pointer Events (mouse, touch, pen), constrained to 8.5:11 or 11:8.5; switching orientation reshapes it; crop taken from the source image
- **Done when:** AC 6 and 7 pass (automated), plus the manual checks in AC 6 and 7 on a real phone

## Phase 4: Circle Visualization ✅
- ✅ Radius formula and adaptive stroke (`max(1, darkness × stroke)`, no rounding)
- ✅ Grid pitch `2 × max_radius`, edge margin so no circle is clipped
- ✅ Chunked rendering off-screen; a newer render cancels an older one; render errors are reported and recoverable
- ✅ Controls: min/max radius, stroke, spacing, circle color, reset, fill toggle
- **Done when:** AC 2, 4, 10 and 11 pass (automated)

## Phase 5: PDF Export 🔶
- ✅ pdf-lib, US Letter, orientation from the rendered canvas, 0.1in margin, centered
- ✅ Download disabled while a render is in progress; PNG encoded with `toBlob` (no base64 copy)
- ✅ Metadata checkbox removed (2026-10-16)
- ⬜ Check PDFs in Preview, Chrome, Adobe Reader (AC 12)
- ⬜ Measure first render, export time and PDF size (AC 13: defaults, 1000×1000 upload, desktop Chrome; pass at < 3 s, < 3 s, < 10 MB)
- **Done when:** AC 5 passes (automated) and AC 12–13 pass manually

## Phase 6: UI/UX & Responsiveness 🔶
- ✅ Colors, typography and layout from the style guide
- ⬜ Fix crop overlay on narrow screens: JS sets a 500px inline width/height on both canvases; `.selection-canvas` has no `max-width`, so under ~540px the preview is squashed and the overlay overflows it
- ⬜ Verify layout at 320, 375, 768 and 1280 px widths
- **Done when:** at 320, 375, 768 and 1280 px widths the preview keeps its aspect ratio and selection corners land within 2 px of the pointer, with mouse (desktop Chrome, Safari) and touch (iOS Safari, Chrome Android)

## Phase 7: Testing, Documentation & Deployment 🔶
- ✅ Deployed via GitHub Pages from `docs/`
- ✅ `scripts/sync-docs.sh` mirrors `src/index.html`, `js/`, `css/` into `docs/`; `--check` verifies
- ✅ Automated end-to-end checks: `scripts/run-tests.sh` (headless Chrome, `test/app.test.js`, AC 1–11)
- ✅ README and spec match the app
- ⬜ Cross-browser pass: Chrome, Edge, Firefox (macOS/Windows), Safari (macOS), iOS Safari and Chrome Android on real devices
- ⬜ Accessibility pass: all controls reachable by keyboard, visible focus, `aria-live` status messages, Lighthouse accessibility ≥ 90
- **Done when:** every AC passes and the cross-browser and accessibility passes have no open issues

---

## Remaining Work (in order)

1. Narrow-screen crop overlay (Phase 6)
2. Real-device check: crop by touch, default render on iPhone/iPad (long edge is lowered at defaults), export (Phases 3, 6)
3. Memory: reuse one offscreen canvas across renders; consider a lower desktop area cap (see Risks)
4. Measure render/export time and PDF size (AC 13)
5. PDF viewers (AC 12) and cross-browser pass (Phase 7)
6. Accessibility pass (Phase 7)
7. Layout check at 320 / 375 / 768 / 1280 px (Phase 6)

## Release Checklist

Before pushing to `master` (which deploys Pages). Run scripts with `sh` because Dropbox can drop the executable bit.
1. If any JS or CSS changed, bump the `?v=` query on all four script tags in `src/index.html`
2. `sh scripts/sync-docs.sh`, then `sh scripts/sync-docs.sh --check`
3. `sh scripts/run-tests.sh` passes (needs Google Chrome and network for pdf-lib)
4. `grep -n "console.log" js/` finds nothing (`console.warn`/`console.error` for real failures are fine)
5. spec.md, README.md and this plan describe the change
6. Commit including `docs/`, push, then open the live Pages URL, confirm the new `?v=` loads, and do one upload and export

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
| 2026-10-15 | Default long edge 250 with an automatic canvas-limit cap | Superseded by the 100 default below; the cap remains |
| 2026-10-15 | Defaults changed to min radius 5, max radius 30, long edge 100 | Requested by the project owner |
| 2026-10-15 | Cancel stale renders instead of Web Workers | Fixes dropped/mixed slider updates; workers not needed at current sizes |
| 2026-10-15 | Step 2 preview shown at full resolution | The downsampled grid looked blurry when scaled up for cropping |
| 2026-10-16 | Downsample uploads over 2000px instead of rejecting | Phone photos are usually larger than 2000px; 2000px is plenty for preview, crop and up to 500 circles |
| 2026-10-16 | Circle color picker; one color for stroke and fill; white background | Requested by the project owner |
| 2026-10-16 | Crop selection uses Pointer Events | Mouse-only selection made cropping impossible on touch devices |
| 2026-10-16 | Export disabled during renders; orientation from the rendered canvas | Exporting mid-render could pair a new orientation with the old artwork |
| 2026-10-16 | Removed the "Include metadata" checkbox | It had no effect; decided not to write PDF metadata |

## Risks

| Risk | Mitigation |
|------|-----------|
| **Browser canvas size limits** (blank canvas) | Long edge lowered automatically. Limits are hard-coded, and iOS/iPadOS is detected from the user agent (`iPad`/`iPhone`/`iPod`, or `MacIntel` with touch points), which may misclassify some devices. Verify on real devices |
| **Peak memory** | One upload can hold the 2000px source, a 2000px preview and overlay, an offscreen and an on-screen circle canvas (~24M px each at defaults, ~96 MB), plus the PNG during export. iOS Safari also caps total canvas memory. Mitigations: `toBlob` export (done); reuse one offscreen canvas (Remaining #3); measure on a phone |
| **Unit conversions** (grid px → canvas px → PDF pt) | One geometry function (`CircleVisualizer.getLayout`); exporter only scales the finished canvas; covered by tests |
| **`docs/` drifting from source** | `scripts/sync-docs.sh --check` in the release checklist |
| **Stale JS cached on Pages** | `?v=` cache-busting bump in the release checklist |
| **pdf-lib CDN unavailable** | Export shows "PDF library not loaded"; tests also fail offline. Consider vendoring pdf-lib into `js/` |
| **Test harness limits** | Tests run under Chrome's `--virtual-time-budget`, which can outrun real work: the runner uses a large budget, and the test drops timers ≥ 30 s, so the image-load timeout path is untested. iOS is simulated by spoofing the user agent only (not the iPadOS path). Results are written incrementally and the run only passes when it reaches `DONE` |

## Known Constraints & Limitations

- Static files only (GitHub Pages); no offline use
- Uploads are capped at 2000px on the long edge (larger images are downsampled); very large or animated files are untested on low-memory devices
- GIFs use the first frame; SVG is rejected
- PDF contains a raster image, not vector circles
- At the defaults, iPhone/iPad renders use a lowered long edge for most images

## Future Enhancements (Post-MVP)

- Other shape modes (dots, dashes)
- Settings presets / remember last settings
- Undo/redo
- Batch export
- PWA offline support

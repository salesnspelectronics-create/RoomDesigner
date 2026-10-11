# SVG library and engine (V139)

The SVG engine is `svg-engine.js`. It depends only on browser DOM APIs and owns sanitization, ViewBox validation/crop, artwork bounds, fit/center/stretch layout, point transforms and viewport clipping. Library/UI state stays in RoomDesigner. To reuse the engine, load this file and call `SvgEngine`; no credentials, storage or network are required.

Published release data is in `data/svg-library.json`, `data/equipment-svg-map.json` and `assets/svg/`. The matching `data/svg-library-builtin.js` provides the complete offline fallback. V139 contains **33 symbols and 40 equipment-type mappings**, covering every existing catalog entry and architectural symbol, plus lighting, outlets, data ports, access points, cameras and a generic custom-device fallback. Existing `planLibrary`/`architectureSvg` metadata and rendering remain available for legacy documents.

## User workflows

Open **کتابخانه SVG** from the desktop toolbox or the mobile Add panel. Search by name, ID or category. Select a symbol to see its equipment assignments and current drawing users. It can be inserted into a drawing, assigned to multiple types, exported or edited. Imported SVGs and assignments are saved only in this browser's local draft store. Unchecking an assignment removes that local default. Existing placed equipment is never rewritten by assignment changes.

Properties offers the current preview, library selection, SVG editing, default reset, dimensions, numeric rotation, quarter turns, flips and fit/center/stretch. These controls include equipment with ports. Ports and cable endpoints use the same center-based transform; cable references retain their IDs. Corner drag and pinch resize retain the equipment center.

The crop editor shows before/after previews and the current ViewBox rectangle. Drag on the SVG preview or enter exact x/y/width/height. Save uses the visible numeric fields. Auto Trim includes nested transforms and conservative stroke padding. White elements are retained; the element picker lets the user explicitly remove a background or other shape. Reset restores the original SVG. Crop saves participate in document Undo.

**Fit** scales proportionally to the available frame, including upscaling. **Center** retains native ViewBox size in drawing units, centers it, and reduces it only if required to fit. **Stretch** fills both dimensions and explicitly overrides the embedded SVG root's preserveAspectRatio. DXF uses the same layout and clips line geometry to the SVG viewport. PDF uses the current rendered drawing. A portable drawing SVG is available from the mobile main menu.

## Storage and compatibility

New placed equipment receives `svgAssetId`, `svgAssetVersion`, an embedded `svg` snapshot and `svgOriginal`. Crop also stores `svgCrop`. Existing rotation, flips and `svgMode` remain ordinary document fields. Document exports, autosave, revisions, duplication and import preserve these fields. Imported executable SVGs, external resources, entities and invalid crop/mode/version values are rejected before replacing the drawing.

Old embedded SVGs and old architectural symbols keep their existing source and are not automatically replaced. Library updates do not rewrite snapshots. Published files load atomically; if any file fails, the complete bundled release remains available. Missing references fall back to the legacy kind or generic symbol.

## Publishing library edits

Use **خروجی برای انتشار** to download `svg-library-publication.json`, which includes the manifest, mappings and every SVG file. Individual SVG, manifest and map downloads are also available. From a checked-out repository:

```sh
npm install --no-save --package-lock=false jsdom@30.1.2
node tools/svg-library-release.cjs /path/to/svg-library-publication.json
node tools/svg-library-release.cjs --check
```

The helper validates all entries and paths before writing any files, rebuilds the offline fallback, and preserves unrelated assets. Review the diff, run regression checks and publish through the normal GitHub commit process. Browser edits do not write to GitHub. The site uses no GitHub access token.

## Validation and limits

```sh
node tests/import-validation.test.cjs
node tests/svg-display.test.cjs
node tests/svg-library.test.cjs
npm install --no-save --package-lock=false playwright@1.58.2
npx playwright install chromium
node tests/svg-engine.browser.test.cjs
```

The Chromium regression is provided for optional manual execution; automatic CI was not enabled because the user requested to perform runtime testing. For a locally installed Chromium-compatible browser, set `BROWSER_EXECUTABLE` to its executable path. Screenshot output can be redirected with `TEST_ARTIFACT_DIR`.

DXF retains the prototype's sampled curve/outline representation; it does not encode full SVG text fonts, gradients, masks or fills. Real CAD round-trip fidelity, iPhone gestures, and printed PDF appearance require device/user acceptance. Bounds use conservative padding and can leave extra space around thick strokes. Local browser drafts are not shared or automatically included in project files; placed artwork snapshots are included. Shared writable backend storage remains outside this release.

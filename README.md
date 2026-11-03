# RoomDesigner

Current source release: **V303-R** (runtime acceptance pending user).

V272: [physical connections, equipment and field devices](./CONNECTION-MODEL.md).

Cable drawing and editing: [drawing modes, editing and obstacle-safe automatic routing](./CABLE-ROUTING.md).

Standalone mobile-first technical room and connection diagram prototype.

## Versioning

Use sequential integer versions: v4, v5, v6, … (no semantic dotted versions). Each release changes the displayed version, receives a descriptive Git commit, and should receive a matching Git tag when supported.

## Run

Open `index.html` in a normal browser. For iPhone, host on HTTPS (for example GitHub Pages); opening a downloaded HTML file through iOS Files/preview may disable interactive JavaScript.

## Deployment (GitHub Pages)

GitHub repository → Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/ (root)` → Save.

Expected URL: https://salesnspelectronics-create.github.io/RoomDesigner/

## Scope and limitations

This is a prototype, not a production CAD engine. The app uses index.html plus local JavaScript/data/SVG assets; no React, Node.js, ASP.NET, or database is needed to serve it. Any browser-local autosave is device/browser-specific: export project files to retain backups. Mobile Safari runtime behavior and DXF/PDF export require device acceptance testing.

RoomDesigner is independent from NSP Office; the latter is intentionally unchanged. Publishing this repository publicly does not itself grant an open-source license to reuse proprietary portions; license choice and third-party dependency audit remain pending.

## Project Evolution

Project source of truth: [project-evolution.json](./project-evolution.json). Governance and edit discipline: [PROJECT-EVOLUTION-INSTRUCTIONS.md](./PROJECT-EVOLUTION-INSTRUCTIONS.md). This RoomDesigner record is independent from NSP Office and preserves mobile UX, port/interface, SVG, storage and revision decisions.

## Import validation (v132)

Project imports are validated before replacing the current drawing or writing browser storage. Malformed document geometry, layers, revisions, communication types and catalog entries are rejected; imported SVG uses the existing sanitizer. Supported type colors are hexadecimal CSS colors. Files larger than 25 MiB are rejected. Bare legacy document files can still be opened without replacing the current catalog or communication types.

Run the dependency-free regression tests with Node.js 18 or newer:

```sh
node tests/import-validation.test.cjs
```

These tests cover import state/storage preservation and compatibility; they do not replace real browser or iPhone acceptance testing.

## Layers and group selection (v239)

Selecting a grouped object from Layers selects the whole group, including after object or layer Hide/Show. Ctrl/Shift/Command selection expands the current group into its actual members before toggling an individual member.

```sh
node tests/regression.test.mjs
node tests/import-validation.test.cjs
npm install --no-save --package-lock=false playwright
npx playwright install chromium
node tests/layers-group.browser.test.cjs
```

The browser regression covers mixed device/wall/cable groups across layers, visibility, copy selection, group dragging, Undo/Redo and Ungroup. Set `TEST_BROWSER_PATH` to use an existing Chromium-based browser executable. Manual mobile acceptance remains pending.

## Component SVG display (v134)

CorelDRAW SVG class styles are retained while embedded font definitions are discarded; text uses the available system font. Uploaded artwork remains on the component after saving and export/import. Component background color can be edited in Properties on mobile and desktop; SVG components use white by default.

Optional DOM regression test (development dependency only; Node.js 22.12+):

```sh
npm install --no-save --package-lock=false jsdom@30.1.2
node tests/svg-display.test.cjs
```

This test uses a small synthetic Corel-style fixture; user-provided SVG artwork is not included in the repository.

## Shared SVG library (v139)

33 published symbols and 40 type mappings; local library manager, graphical crop/ViewBox editor, reusable SVG engine and port-bearing transforms. See [SVG-ENGINE.md](./SVG-ENGINE.md) for workflows, compatibility, publication and test commands. Final device/browser acceptance is pending the user’s tests.

## Equipment replacement (v260)

The equipment menu now contains the 26 supplied NSP models with full-width rows, right-hand artwork and editable part number, series, Persian name and English name. New equipment defaults to Stretch and visible labels. Original source SVGs and their SHA-256 hashes are retained.

Legacy equipment and dependent cables are removed from browser-local drawings, profiles, revisions, shortcuts and imported files. The retired equipment/connection archive controls and permanent migration backups have been removed; current project autosave and import transaction recovery remain available. See [Equipment migration and recovery](./EQUIPMENT-MIGRATION.md) for the current cleanup scope and tests. Migration happens when each browser opens v260; user iPhone/Safari acceptance remains pending.


## V276 — catalog and editor integration

Semantic equipment is organized by type, subtype, model and installation direction. Lighting, requests, thermostats, doorbells and Negin/Azin three-command power switches use central SVG references, model-specific real artwork, and live properties. The editor adds paged canvas navigation, image objects/paste, line bends and length, integer typography, accurate selection/resize/rotation, and bounded color updates with Undo. Independent main lock/deletion/polyline fixes are retained; local product/editor behavior takes precedence in conflicts. See [model data](./LIGHTING-MODEL.md) and [workspace properties](./WORKSPACE-PROPERTIES.md).

Current regression coverage is in tests/lighting-model.test.cjs and the focused browser suites for power-switch variants, doorbell editing/models, door selection, line length/integer fonts, color-picker performance, images, placement and installation directions. Historical browser fixtures may describe superseded UI/product behavior; they are not the current acceptance specification. Browser/mobile user acceptance remains pending.

## DXF import (V280)

See [DXF-IMPORT.md](./DXF-IMPORT.md) for units, placement, editable grouped imports and unlocking existing reference layers.

## V279 — object name placement

Properties → محل نمایش نام selects پایین آبجکت or بالای آبجکت for each object. Name visibility, font size and color remain independent. Saved drawings retain the position; legacy drawings keep their previous placement. Focused browser regression: `node tests/caption-position.browser.test.cjs`. User acceptance and publication pending.

## Rotation submenu (V279)

Object context menu → چرخش offers 90° left/right and 180° left/right. Hover or click opens the submenu; keyboard navigation, Undo/Redo and object/layer locks are supported. Commit naming: -N for new functionality, -R for fixes.

V280 adds a staged in-app DXF vector importer: preview, source layer selection, unit conversion, crop, editable native layers and optional grouping. No external roomplan conversion is required. See [DXF-IMPORT.md](./DXF-IMPORT.md).

V281 adds confirmed native object recognition inside the DXF preview, centimeter fallback units, Ctrl+N/O file shortcuts and architecture palette furniture additions. Recognition remains a reviewable proposal; unapproved source lines are retained.

V282-R replaces the browser-reserved Ctrl+N shortcut with Ctrl+Alt+N and updates the File menu hint. Ctrl+O remains the file picker shortcut.

V283: DXF import always starts with centimeters/factor 1, with source-unit mismatch notice; toilet proposals; header color/monochrome and global product-detail toggles; supported display modes in product context menus. Commit descriptions are Persian from this release onward.

Product display mode and four-side caption placement use mutually exclusive radio groups. Caption coordinates and text alignment apply to canvas/detail images and DXF output; source validation accepts all four positions.

V284 consolidates runtime feedback: settings/objects import tabs, default-selected proposals and bulk selection, native dressing table with separate lamp/chair, native geometry color without bounding boxes, Persian hover display submenu, property rotation buttons, and header controls before Undo/Redo. Detail leaders route around architectural obstacles; blocked routes show a status rather than crossing walls.

V287-R: مسیر فلش جزئیات دیگر هیچ دیوار هم‌پوشان با نقطهٔ شروع یا پایان را از فهرست موانع حذف نمی‌کند؛ در نبود مسیر ایمن، وضعیت انسداد نمایش داده می‌شود.

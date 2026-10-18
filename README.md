# RoomDesigner

Standalone mobile-first technical room and connection diagram prototype.

## Versioning

Use sequential integer versions: v4, v5, v6, … (no semantic dotted versions). Each release changes the displayed version, receives a descriptive Git commit, and should receive a matching Git tag when supported.

## Run

Open `index.html` in a normal browser. For iPhone, host on HTTPS (for example GitHub Pages); opening a downloaded HTML file through iOS Files/preview may disable interactive JavaScript.

## Deployment (GitHub Pages)

GitHub repository → Settings → Pages → Build and deployment → Deploy from a branch → `main` / `/ (root)` → Save.

Expected URL: https://salesnspelectronics-create.github.io/RoomDesigner/

## Scope and limitations

This is a prototype, not a production CAD engine. Current HTML is self-contained; no React, Node.js, ASP.NET, or database is needed to serve it. Any browser-local autosave is device/browser-specific: export project files to retain backups. Mobile Safari runtime behavior and DXF/PDF export require device acceptance testing.

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

Legacy equipment and dependent cables are removed from browser-local saved drawings, profiles, revisions and shortcuts after a durable backup. Imported legacy files and IndexedDB recovery have separate backups. See [Equipment migration and recovery](./EQUIPMENT-MIGRATION.md) for the exact scope, downloads, recovery procedure and tests. Migration happens when each browser opens v260; user iPhone/Safari acceptance remains pending.

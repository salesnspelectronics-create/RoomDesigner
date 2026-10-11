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

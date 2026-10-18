# Equipment catalog — v260

The 26 confirmed models are defined in `data/equipment-catalog.json`. Each has a part number (`code`), Persian display name (`name`), English name (`nameEn`) and model/series (`model`). `sourceFile`, `originalFilePath` and `sourceSha256` identify the exact supplied SVG; unmodified originals are retained in `assets/svg-source/`. Published, sanitized artwork is in `assets/svg/equipment/`, the shared manifest/map and the offline fallback.

Artwork keeps the supplied black/white shapes and internal gradients. New equipment uses Stretch and visible labels. No electrical ports have been invented for models whose interface specifications were not supplied.

## Editing

Equipment uses full-width list rows with the artwork on the right and an add action on the left. Both desktop and mobile use the same rows. Use **ویرایش مشخصات فهرست** to edit the four identity fields for future placements. To edit an existing placement, select it and use Properties. Catalog edits and placed-device edits are independent and survive save/export/import.

## Destructive migration and backup

This is a browser-local application. Publishing v260 cannot reach another user's local storage. Each browser performs migration on its first v260 startup:

1. Validate and stage transformations without changing persistent data.
2. Preserve the original raw local values in `rd_equipment_backup_v260` before any destructive write. The first backup is never overwritten on retries.
3. Replace the equipment catalog and remove legacy equipment and dependent cables from the current document, every saved profile, every revision snapshot and saved shortcuts. Preserve walls, architecture, layers and project metadata. Remove legacy equipment SVG drafts and old equipment ordering.
4. Commit the release marker last. Restore original keys if a write fails. If a durable backup cannot be written, stop and display a backup/download action instead of deleting equipment.

Legacy project imports receive their own persistent raw backup before replacing the drawing. Legacy IndexedDB recovery data receives a separate `pre-equipment-v260` snapshot in the recovery database before it is cleaned; a late recovery is still prevented from overwriting a newer edit.

Use **پشتیبان قبل از جایگزینی** in Equipment to download the initial complete browser backup, the latest imported-project backup, or the pre-migration IndexedDB document when present. The complete backup is JSON with `original` containing exact pre-migration storage values, including the project collection and revision snapshots. Copying the backup file elsewhere is recommended before clearing browser storage.

For a portable legacy project, parse `original.rd_last`, or a project from the parsed `original.rd_profiles`, and save that object as a `.roomplan` file. View legacy equipment with the repository at **v259** (`dd926a15e5c857666f05931d9b0826f0bfb92e3d`). Opening an old project in v260 deliberately removes its legacy equipment again. Original offline project files are untouched until imported.

## Verification

Run the dependency-free checks:

```
node tests/regression.test.mjs
node tests/import-validation.test.cjs
node tests/catalog-display.test.cjs
node tests/equipment-release.test.cjs
```

With development-only `jsdom` and `playwright` installed:

```
node tools/svg-library-release.cjs --check
node tests/svg-source-styles.test.cjs
node tests/svg-display.test.cjs
node tests/svg-library.test.cjs
node tests/equipment-menu.browser.test.cjs
node tests/layers-group.browser.test.cjs
```

Set `TEST_BROWSER_PATH` for an existing Chromium/Edge executable. `SCREENSHOT_DIR` optionally captures desktop/mobile examples in the equipment browser test. Real iPhone/Safari acceptance remains pending.

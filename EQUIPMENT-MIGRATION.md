# Equipment catalog and legacy cleanup

The current catalog has 30 equipment models, defined in `data/equipment-catalog.json` and mirrored offline. Original supplied SVGs or photographs are retained with SHA-256 provenance. Published vector artwork, manifest and mappings stay synchronized. Desktop equipment entries use compact text rows; mobile rows retain previews. Catalog metadata edits affect future placements; existing placements have independent Properties.

## Retired equipment

Opening old browser data or importing an old project removes obsolete equipment and its dependent cables, including saved profiles, revisions and shortcuts. Architecture, walls, layers and project metadata are retained where the equipment migration applies. Current equipment is retained. The previously requested one-time full browser reset keeps its original completion marker and is not repeated for new data.

The old equipment/connection migration archive buttons and their creation, download and recovery APIs have been removed at the user's request. Old local archive keys and pre-equipment IndexedDB archive entries are discarded. Imports no longer create permanent copies of retired equipment. Ordinary project export, Undo, autosave and transaction recovery remain available; generic import journaling is independent of the removed legacy archives. Migration writes still roll back on storage failure.

## Field devices

The **عملگرها و سنسورها** group contains lamp, solenoid valve, fan coil, speaker, smoke sensor and motion sensor. Fan coil replaces all three fan-speed catalog entries and defines five named DO channels. Other actuators retain one DO socket; sensors retain one DI socket. Retired fan placements keep their IDs and wires.

AC12CH has one combined RS-485 + Power port, twelve relay outputs and two DI inputs named S1/S2. AC4CH has the same combined bus, four relays and two DI inputs S1/S2. The inputs face up and are added idempotently to existing mains. Old default input names are renamed without changing port IDs or links.

Power Supply has one Power socket and a reference-based vector illustration; its source photograph is retained alongside the Power Terminal reference.

## Verification

Run `tests/equipment-release.test.cjs`, `tests/connection-model.test.cjs`, `tests/field-devices.test.cjs` and the corresponding browser suites with Playwright and Edge/Chromium. User acceptance and release publication remain pending.

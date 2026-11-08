# V347 experimental DWG preview

This release reads the optional embedded PNG thumbnail before starting any full conversion. It does not implement model-coordinate overview rendering, device picking, or accurate regional geometry extraction. The embedded image can represent a saved view rather than the whole project. Full conversion still uses the existing dwgdxf 2.0.1 worker, explicitly started by the user, with its two-minute limit.

Desktop cancellation is now visible and terminates the conversion worker. Original worker error messages, stacks, stages, file size and signature are retained in the File error log and in a downloadable conversion diagnostic. A failed conversion remains visible in its dialog until dismissed. General notifications now last ten seconds.

## Validation

- Supplied 128,525,665-byte AC1027 file: PNG extracted with 1,499 bytes of bounded reads; 256 by 111 pixels. Inspected extracted image. No drawing geometry is decoded by this preview.
- Six DWG tests pass: bounded reads, malformed pointers/tables, explicit conversion, retry/error details, cancellation, successful mocked conversion, application log persistence and private-fixture preview (some checks share tests).
- 41 existing DXF engine/import tests pass.
- Inline scripts parse successfully; changed modules pass syntax checks.
- Full unit run: 22 pre-existing failures, also reproduced against the unchanged V346 HTML (import-validation, power-terminal, regression harness expectations). No claim that the full suite passes.
- Browser automation could not launch Chrome due to process permission restrictions. A dedicated browser test is included, but desktop/mobile visual and real-browser acceptance remain pending. DOM checks confirm the desktop footer override; they do not prove layout.
- Isolated alternate LibreDWG 0.8.7 probe read with warnings (119); database conversion did not complete during investigation and was stopped. This dependency is not bundled or deployed.

## User test

Open File > Import > DWG and choose the large file. Check that the saved thumbnail appears before any conversion, and that Cancel is visible. Full conversion is optional and remains expected to fail for the supplied large file; report the diagnostic if trying it. Accurate regional import remains an open requirement, not a completed feature.

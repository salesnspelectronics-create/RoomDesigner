# DXF import — V278

Use File > Open File and choose an ASCII DXF. LINE and LWPOLYLINE segments are supported. Blocks, text and native curves must be flattened beforehand.

The HEADER `$INSUNITS` supplies the default factor to centimeters for mm, cm, meters, decimeters, inches and feet. The prompt states the detected unit and permits an override. Unitless/unsupported files retain the explicit 0.1 fallback; verify it against a known dimension.

Geometry is added to the current document at the current viewport center, grouped and selected on an unlocked DXF Reference layer. The camera fits the imported bounds. Existing document objects remain. One Undo checkpoint covers the import. Ungroup to edit individual segments; use the context menu to lock the layer if it should become a fixed reference.

Old DXF layers are not automatically unlocked. Right-click the layer name in Layers and choose «بازکردن قفل». Its object deletion or confirmed layer deletion can then proceed. A locked dependency must also be unlocked. Deleting a layer removes its owned geometry and dependent connections. The last layer cannot be removed; create another layer or remove its objects instead.

Verification: `node --test tests/dxf-import.test.cjs` — 17 focused tests. Existing import-validation/regression suites retain the same 22 baseline failures from missing test harness globals; browser acceptance remains pending. No claim of orphan geometry is made from the user's screenshot: the locked Reference layer was still present.

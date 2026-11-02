# PDF pages as images

Implemented locally for RD-277; published/visible release remains V276 until the user requests publication. Vector object import is deferred.

Use **فایل > واردکردن PDF**. Select a PDF, tick pages, click a thumbnail to preview it, drag a crop rectangle. Move it by dragging inside; resize it using eight corner/edge handles. Crops are independent per page. Reset restores the full page. Quality sets the long side of each full-page raster to 1500/2400/3200 pixels before cropping. PDF page rotation is honored. Import adds the selected pages in document order as independent, proportionally resizable image objects with a 24-unit gap.

`assets/pdf-import.js` owns the modal and lazy thumbnail rendering. Only visible thumbnail pages are queued; preview fits the available area on desktop and mobile. Closing cancels the loading/rendering session without adding objects. Invalid/encrypted files show a readable message. All selected images are prepared before the callback changes the drawing; the batch has one Undo checkpoint. The original PDF is not saved in the document. Each image stores imageAssetId plus pdfSource filename/page/normalized crop. Existing document/image persistence and exports apply.

Mozilla PDF.js 5.6.205 is bundled in assets/vendor/pdfjs with its worker, CMaps, standard fonts, WASM and license notices. It loads only when PDF import is used. All processing stays in the browser, with no CDN or upload. The preview server serves .mjs as JavaScript, .css as CSS and .wasm as application/wasm. Serve through HTTP (local preview or GitHub Pages). File size cap is 80 MB; existing per-image limits remain enforced.

Validation: tests/pdf-import.browser.test.cjs uses ROOM_PDF_FIXTURE if set, otherwise the supplied local ATOUSA sample when present, otherwise generates a portable rotated six-page PDF fixture. It covers actual PDF rendering, pointer crops, page switching, all/none and multiple selection, independent crop state, two non-overlapping image objects, aspect ratio, schema validation, one-step Undo/Redo, reload, cancel, invalid files and mobile dimensions. Reviewed screenshots are ignored under work/. User acceptance remains pending.


RD-278 supersedes the numeric crop UI: percentage fields are removed. Crop-body movement preserves dimensions and stays inside the page. Edge/corner resizing anchors the opposite edge/corner, with a small minimum size. Pointer cancellation restores the previous crop. Keyboard arrows adjust a focused crop/handle by one display pixel; Shift uses ten pixels. Independent page crops, reset and raster import remain unchanged.

# Electrical panel

The electrical-panel catalog product appears in actuators/sensors. It has no installation direction and no initial ports. Its three display modes are part number (EP), iconic and real photo. Assets are referenced through the shared SVG registry; instances contain no photo/SVG payload. The real asset contains an optimized copy of the supplied photo. Iconic artwork is vector.

## Configurable ports

A catalog entry opts in with portPolicy=configurable; fixed products are unchanged. Instance ports use stable id and catalogPortId. The existing devicePortDefinitions adapter exposes those definitions to visibility, side radios, port location animation, global controls and cable creation. No duplicate definition array is stored.

The Ports tab accepts a name, one of the five canonical types and a side before adding. A blank name receives a type-based name. Each addition/removal has an Undo step. Hiding ports keeps IDs and connections. Removing a connected port is refused; removing an unconnected one clears its saved side and any active cable draft. Object/layer locks and stale inspector ownership are respected.

Room import validates configurable port types, names, unique definition IDs and side references. Reload and export retain ports using the normal document model.

## Photo ingestion

SvgEngine accepts image nodes only with embedded base64 PNG/JPEG/WebP href values under its existing total SVG size limit. External images, scripts and embedded SVG images remain rejected. This supports offline display and exports without fetching the original photo path.

## Checks

The focused electrical-panel browser suite covers toolbox entry, all three modes, raster restrictions, empty initial ports, all canonical types, all sides, visibility and location animation, stable IDs, Undo/Redo, connected-port deletion guard, fixed-device exclusion, 15 custom ports and reload. Gallery screenshots are in work/electrical-panel-gallery.png and work/electrical-panel-ports.png. Catalog, existing hardware, equipment ports and global display suites are also checked.

Local implementation, V276; release and user acceptance pending.

The add-port form retains the last selected type and side throughout the session, independently of document geometry/history, while clearing the name after submission. Its action aligns left with a separate top gap; per-port removal uses a compact trash icon.

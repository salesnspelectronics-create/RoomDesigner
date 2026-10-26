# Physical connection model — local changes pending release

The next source release uses these physical connection types for both port fills and cable strokes:

| ID | Name | Color |
| --- | --- | --- |
| `power` | Power | `#DC2626` |
| `rs485` | RS-485 | `#7C3AED` |
| `rs485_power` | RS-485 + Power | `#16A34A` |
| `do` | Digital Output — DO | `#D97706` |
| `di` | Digital Input — DI | `#0891B2` |
| `ethernet` | Ethernet | `#2563EB` |

Using network cable for RS-485 does not make that connection Ethernet. Command messages, device numbers, relay functions and key-to-output control bindings are deferred.

The original 28 equipment entries explicitly define a top-facing `RS-485 + Power` port in `data/equipment-catalog.json`, mirrored in the offline catalog. AC12CH additionally defines 12 Digital Output ports: R1 and R2 face up; R3 through R12 face down. AC4CH defines four bottom-facing outputs named R1 through R4 and two top-facing DI inputs S1/S2. These are template defaults; previously saved per-device port sides remain editable and are preserved. Port hover titles include both communication type and port name. Existing main placements gain missing relay ports without replacing their bus port IDs or cables. Previous separate Power/Ethernet defaults and the provisional relay-as-RS485 definitions are superseded; AC12CH also defines two top-facing DI inputs named S1 and S2; existing main placements gain these without replacing current port IDs or wiring.

The 29th equipment model is **Power Terminal** (`POWER-TERMINAL`, Persian name پاور ترمینال). It has seven numbered `rs485_power` ports and one `power` input named Power IN. Ports 1–2 face up, port 3 faces left, ports 4–7 face down and the power input faces left. Its portrait SVG is a vector illustration redrawn from the supplied photograph, with the original PNG and SHA-256 retained for provenance. Defaults use 84 × 148 map units. Current saved catalogs gain the entry once without rerunning the old equipment/storage reset.

The 30th model is **Power Supply** (`POWER-SUPPLY`, منبع تغذیه), with one top-facing `power` port. Its portrait SVG is redrawn from the supplied photograph, whose original PNG and SHA-256 are preserved. No voltage/current ratings are inferred.

The separate **عملگرها و سنسورها** section contains six SVG symbols: lamp, solenoid valve, fan coil, speaker, smoke sensor and motion sensor. The fan coil replaces the three fan-speed templates and has five DO sockets: دور فن 1, دور فن 2, دور فن C, لوله آب گرم and لوله آب سرد. Its three fan sockets face up; the two water controls face down. Lamp, valve and speaker retain one DO socket each. Both sensors retain one DI socket. Old placed fan devices and their wires remain intact; only their retired catalog entries are removed. Desktop and mobile use the same templates.

## Explicit one-time browser reset

The user requested deletion of the previous browser data. On first startup of this change, the application removes its own `rd_*` LocalStorage keys and deletes the `room-designer-recovery` IndexedDB database. This includes old drawings, profiles, revisions, shortcuts, custom equipment and communication types, user settings and old browser backups. Unrelated origin keys, downloaded project files and repository source files are untouched.

`rd_storage_reset_physical_v1` tracks clearing, pending recovery deletion and completion. A completed reset does not run again: new drawings and settings survive refresh. Recovery initialization waits for deletion so an old IndexedDB drawing cannot replace the fresh document. The application may request a user name again after reset.

New project exports and Revision snapshots carry `connectionModel: physical-connections-1`. Legacy files imported later have old equipment and its dependent wiring removed, and logical ports normalized. The retired equipment/connection archives, backup controls and download APIs have been removed. Current autosave and generic transaction recovery remain separate. New-model files retain their connections.

## Focused verification

With Node.js:

```text
node tests/connection-model.test.cjs
node tests/actuator-catalog.test.cjs
node tests/equipment-release.test.cjs
```

With Playwright and an available Chromium/Edge executable:

```text
node tests/connection-model.browser.test.cjs
node tests/workspace-navigation.browser.test.cjs
```

Browser checks cover reset and recovery deletion, later save/reload preservation, legacy normalization, six colors, consumer icons and placement, new wiring, export/import, mobile menus and existing canvas navigation. Physical device and user acceptance remain pending. Source version, commit and push remain deferred until the user requests publication.

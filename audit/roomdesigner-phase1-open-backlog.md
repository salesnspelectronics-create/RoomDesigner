# RoomDesigner — Phase 1 open backlog

Updated: 2026-10-22. Audit/implementation ledger only; this is NOT runtime acceptance, a product release, or a replacement for `project-evolution.json`. All changes described below were pushed WITHOUT tests at the user's explicit request.

## Source changes awaiting runtime verification
- History Undo/Redo rollback on render failure: 689a27f05e1cf122e750843763adc357c8a973a5.
- Retry failed primary save when page exits: c26773e14b1c27159f8c5a29185e5319c1f7bd8b.
- Abort import when durable migration backup pointer cannot be saved: 93b4d7865b7b687d9a8d87327bd3fad7975beb97.
- Recovery restores previous document reference when render fails: 624209ff6f484b638568c02579df2b87cba09e7d.
- Clean incomplete migration backup: 4b4d7fe95fe637f8db494234ccb16f62a9b1aae7.
- Reset stale mirror success indication for new save generation: 4634cc09b610ce6a8f7ce192e17229a04d8b9756.
- Restore in-memory migration pointer during import rollback: 1559c2f10b88c5b1608d2011aa2fdaa6d7bc18b6.
- Restore persisted backup pointer and discard newly written backup when import fails: 238e26103c1e94fa3aa279e59a91f8b862e53ed1.

## Additional untested phase-1 direct commits (2026-10-22)
- Revision save restores the previous document and embedded history if profile persistence fails: 0199e3c35089c907bae4f243cb58530b52c88423.
- Fix failure rollback for Save As profile ownership: a9ed548ebfffdd9a2c75bbe01b0481e6486fd1c1.
- Import no longer reports current primary save as successful when it fails: ea50e6fe63fb43d0da57382a3a2a1c8b2abbd450.
- All above changes are SOURCE-COMMITTED but UNTESTED and NOT runtime Done.

## Still open, not claimed fixed
- P1: Page-exit IndexedDB transaction completion cannot be guaranteed; localStorage failure plus abrupt termination can lose the newest edit.
- P1: Full atomicity of import including secondary async IndexedDB mirror and post-commit side effects is not established; a current primary save failure is now reported rather than silently announced as success.
- P1: Profile persistence failure now restores in-memory revision history, but a successful profile write with a failed current-snapshot save may still leave stores inconsistent; archive download fallback cannot verify an actual saved file.
- P2: No unified persisted generation/checksum authority for LocalStorage and IndexedDB mirror.
- P2: Migration persistence and recovery paths have not been runtime-validated under storage failures.
- P2: Existing historical N03–N14 audit risks remain pending unless covered explicitly by a verified fix.
- Governance: project-evolution.json V260 vs UI v271 requires authoritative release-history reconciliation, not automatic bump.

## 2026-10-22 focused review — unresolved cross-store atomicity
- Storage authority: `rd_last` and IndexedDB `backups/last` currently store raw document JSON, not a shared persisted generation/checksum envelope. Adding metadata only to one store would break comparison or older recovery. Design a backward-compatible envelope, document selection rule, and migration path before code change.
- Import: `applyRoomImport` writes several LocalStorage keys, then invokes `saveAuto()` which queues IndexedDB asynchronously. A late mirror failure cannot be rolled back together with already committed LocalStorage and in-memory state. Do not claim full atomicity from the current synchronous rollback implementation.
- Revisions: `saveLocal` writes `rd_profiles` and subsequently `rd_last`; a failed second write leaves a persisted profile revision with an older current snapshot. A safe solution must establish a transaction/recovery marker or recoverable staged commit, particularly when trimming old revisions.
- Existing direct commits are incremental mitigations only. For this no-test pass, no speculative modification to storage formats or commit ordering was deployed. Keep these three P1/P2 issues OPEN.

## Latest no-test implementation and unresolved compatibility contract
- Commit `511a8a2a6fc2438378d553703021aec7590a7e2b`: when the current-document write fails during Revision save, restore previously persisted `rd_profiles`, in-memory profile and document; report explicit failure if rollback also fails. This is best-effort compensation, not an atomic cross-store transaction.
- Generation/checksum design requirement: preserve existing raw JSON in `rd_last` and IndexedDB `backups/last` for legacy clients, introduce a separately versioned durable authority record only after both payloads can be validated, and define legacy/missing/partial-marker fallbacks. Pending; NOT implemented.
- Import/Mirror requirement: store a recoverable import intent and pre-import snapshot durably, treat IndexedDB mirror completion as asynchronous and recover incomplete intents on next startup. Pending; NOT implemented.
- Revision requirement: recoverable pending revision intent or authoritative snapshot with monotonic identifier; protect history before pruning and guard failure of compensation. Pending; NOT fully implemented.
- No test was run, so even implemented mitigations require runtime confirmation. Do not promote any of these to Done.

## 2026-10-22 compatibility increment — no tests
- `d8a8f2bc25d7bda13e8b999fe4939ef6e66273d7`: IndexedDB writes raw legacy JSON at `backups/last` and sidecar `backups/last-meta` (format, length, FNV-1a checksum, save timestamp) in the *same IndexedDB transaction*.
- `204dd74105cb101d3f33f9bbd78cc74d3a3ab04e`: Startup mirror recovery verifies checksum when sidecar exists; old mirrors without metadata remain readable. Runtime behavior UNTESTED.
- Open: neither an authoritative persistent cross-store generation nor a stable LocalStorage sidecar exists; a timestamp in mirror metadata is not proof of latest authoritative state. Do not claim deterministic cross-store reconciliation.
- Open: durable Import intent and interruption recovery for asynchronous mirror and cross-store Revision transactions are not implemented. Do not declare phase 1 complete.
- Important: the mirror checksum is a corruption-detection hash, not a cryptographic authenticity guarantee.

## 2026-10-22 generation metadata incremental changes (untested)
- `72b6419c9aa1a1e9b937ba3235804fdb187c8cc4`: localStorage `rd_save_generation` sidecar and IndexedDB `last-meta` generation field, without changing legacy document JSON.
- `de51948c72ca297f1701e7741bb804e25797182d`: capture the generation when the payload is produced, rather than when the asynchronous IndexedDB queue eventually runs; `null` means a durable primary generation could not be assigned.
- **OPEN / not authoritative yet**: localStorage payload and generation are two separate writes, and `mirrorOperation` has its own IndexedDB transaction; a crash between writes still leaves ambiguous versions. Existing startup recovery still gives precedence to a valid `rd_last`. No automatic generation-based conflict resolution has been deployed.
- **OPEN**: durable import intent/rollback on restart and cross-store Revision recovery are not implemented. Last session's in-memory rollback is insufficient after a crash.
- All changes are untested per explicit user instruction; do not mark Phase 1 complete or count these as runtime verified.

## Interrupted-import journal increment — 2026-10-22
- `16086a0148935d7ce6552bd344ff16e304ed72c7`: a durable `rd_pending_import` journal stores old values for `rd_last`, `rd_types`, and `rd_catalog` before synchronous import writes. Startup attempts rollback when a journal remains. Import aborts if journal cannot be written.
- Limitations OPEN: migration backup pointer is written prior to the new journal; its startup rollback is not included. IndexedDB mirror is asynchronous and is not committed with the journal. Successful journal cleanup is only a synchronous-local commit boundary. Runtime behavior is UNTESTED.
- Revision crash-recovery journal: NOT implemented. The existing best-effort compensation remains insufficient for a browser crash between profile/current-document writes.
- Cross-store authoritative selection: NOT implemented; keep legacy valid LocalStorage precedence and never silently promote an IDB mirror just because generation metadata exists.

## 2026-10-22 crash-recoverable Revision journal — untested
- `8735effbbff9a35d2efe7a9b2e56646da5323116`: write `rd_pending_revision` with prior durable `rd_profiles` and `rd_last` before starting Revision writes; restore both keys when a pending journal is detected on startup. Journal removal follows the successful synchronous writes. This protects against interrupted local writes but does NOT make IndexedDB mirror atomic.
- **OPEN**: import migration backup pointer is written before import journal; restore after crash is not complete.
- **OPEN**: IndexedDB mirror cannot be atomically committed with LocalStorage, and mirror metadata cannot safely override an intact valid legacy `rd_last` on mere generation comparison. Conflict-selection authority remains unchanged.
- **OPEN**: a failed journal cleanup or failure of storage compensation requires operator recovery; browser/runtime outcomes are not tested. No issue is marked Done.

## 2026-10-22 migration journal ordering change — no tests
- `107a7554f92578d40b7db581d7f7cc0592ea2b55`: the Import journal is now written before modifying migration backup contents or backup pointer. Format 2 journals include previous backup-pointer and newly allocated backup-key values, and startup recovery recognizes both legacy format 1 and format 2.
- Source push only; crash/recovery behavior is UNTESTED. Journal remains scoped to synchronous LocalStorage state. IndexedDB mirror completion and conflicts are still independent.
- OPEN: Ensure a truly authoritative cross-store commit protocol if automatic snapshot selection is required. Prefer valid intact legacy LocalStorage state rather than overwrite it with a mirror based on possibly torn generation sidecars.
- OPEN: Asynchronous IndexedDB mirror completion is not atomically bound to Import or Revision; failures remain separately reportable. No claims of fully atomic recovery or runtime Done.

## 2026-10-22 incomplete rollback guard — no tests
- `012f819922aedaacf0063cad9cf7e19b1b3b7931`: startup does not proceed to automatic IndexedDB mirror recovery when LocalStorage Import or Revision journal rollback failed, or cleanup of the journal failed. It retains the pending journal for further recovery and flags persistence as unsafe.
- OPEN: the async mirror write is not atomically committed with Import or Revision. Sidecar generations cannot conclusively rank torn LocalStorage writes against a completed IndexedDB transaction; do not override a valid legacy local snapshot solely on a greater generation.
- OPEN: no full atomic cross-store transaction or crash-consistent authoritative selector implemented. Current source change is an untested safety guard, not closure of Phase 1.
- V8.2 scheduled regression remains paused. No tests were run in this pass.

## 2026-10-22 import journal lifetime adjustment (untested)
- `8e01e16a0f171f0c5e847ff62074862eab974de8`: Import's `rd_pending_import` is now retained until the primary `saveAuto()` reports successful synchronous storage, rather than cleared before that save. A primary failure leaves the journal available for startup recovery; failed journal cleanup is surfaced as unsafe persistence.
- Remaining P1: IndexedDB mirror completion is asynchronous and may occur after the local commit; no true cross-store atomic commit or proven authoritative conflict resolution. A valid legacy LocalStorage document retains precedence. Sidecar generations may be torn by crashes and are not sufficient to override it.
- Remaining P1: Revision journal still covers synchronous stores only, not an atomic commit with IndexedDB. Unverified runtime behavior remains open.
- No tests were executed per explicit user request; no runtime issue marked Done. V8.2 remains paused.

## Execution discipline
- Scheduled V8.2 regression remains paused; do not reactivate.
- No automated or browser tests have been run during these user-authorized direct-push phase-1 changes.
- Runtime status: UNVERIFIED; no item may be marked Done solely from GitHub commits.

## 2026-10-22 queued Import mirror journal change — untested
- `a025cda3a3abf86347d748b5061262e7647d7e14`: Import recovery journal cleanup waits for the queued IndexedDB mirror completion rather than clearing immediately after LocalStorage save. A failed mirror leaves a recoverable journal and signals a warning.
- OPEN P1: If additional edits advance `mirrorGeneration` before the import mirror settles, journal cleanup is intentionally skipped. The next startup may roll back those later edits. A proper transaction ownership/commit marker and post-import lifecycle are still required.
- OPEN P1: No proven atomic commit or deterministic latest-valid snapshot selection across legacy LocalStorage and IndexedDB. Retain compatibility-first selection.
- OPEN P1: Revision and recovery workflows remain runtime-unverified; this change was pushed without tests at user direction. Do not close Phase 1.

## 2026-10-22 superseded import journal guard (NO TESTS)
- `106847c907fa7bcedc7815dbf42afb8858d3ee8f`: an import journal is no longer left indefinitely solely because the asynchronous mirror completion callback sees a newer save generation.
- `6ef50c704574e6a0b2fc834c7c5be8dd944c8dd2`: the superseded journal is cleared only if the newer LocalStorage save succeeded; otherwise preserve recovery data and warn.
- **OPEN**: a browser crash before the asynchronous callback still leaves the old import journal; startup currently rolls it back without checking a durable committed import/newer-edit marker. Thus the original crash window is reduced, not eliminated.
- **OPEN**: deterministic safe choice between legacy LocalStorage and IndexedDB needs an atomic authority protocol, not sidecar generations alone. Revision journal crash/rollback handling and cross-store mirror durability still need work.
- Source publication was direct with no tests; runtime validity remains unverified. V8.2 stays paused.

## 2026-10-22 durable Import commit marker (no runtime tests)
- `1daaaafa5d3d61d46d9d3cbc97c39b8a9a7d3072`: after successful primary Import save, persist `rd_import_committed` checksum; on startup, a matching current `rd_last` prevents the older pending Import journal from rolling it back. Legacy pending journals without a matching marker continue through existing rollback.
- `e83dbe6d6384d75afa97309ab49341b9c608a92b`: subsequent successful `saveAuto` calls carry the durable Import commit checksum forward while Import journal remains pending.
- **OPEN**: marker and document are separate LocalStorage writes; process termination between them can still produce a stale marker and unwarranted rollback. Strong crash consistency requires staged authority/transaction identifier or copy-on-write payload, not this best-effort marker alone.
- **OPEN**: IndexedDB / LocalStorage authoritative snapshot selection, async Mirror ownership, and Revision cross-store recovery remain unproven. No automated tests were run and Phase 1 MUST remain OPEN.

## 2026-10-22 staged Import snapshot (no tests)
- `6dae7d1297a02149a539cb1992417653226fa3e5`: prewrite Import journal format 3 now records expected hashes for the synchronous LocalStorage import writes. Startup treats a fully matching staged snapshot as committed even when a crash occurred before writing `rd_import_committed`, avoiding erroneous rollback in that interval. Existing formats 1/2 remain readable.
- `382c356c5f044619851b875b3ea781406458f16d`: startup validation accepts the migration backup key in format 3 as well as format 2.
- OPEN: crash between individual Import writes still requires partial rollback; the journal's consistency has not been runtime-tested. The snapshot hash is noncryptographic. Generation sidecars remain non-atomic, and neither latest-valid LocalStorage/IndexedDB arbitration nor Revision cross-store atomicity is complete.
- V8.2 remains paused. No tests were run, per request. Do not close Phase 1.

## 2026-10-22 staged Revision commit detection (NO TESTS)
- `dd3368d604b2dcfdfea0dd1186b0191fa770b954`: Revision journal format 2 records expected checksums of `rd_profiles` and `rd_last`. During startup a complete matching revision is retained, rather than rolled back merely because journal cleanup was interrupted. Journal format 1 remains readable.
- OPEN: a subsequent edit before Revision journal cleanup can change the current snapshot, leaving an obsolete pending journal; startup could still roll back later work. Asynchronous IndexedDB persistence and LocalStorage sidecars remain separate transactions.
- OPEN: no authoritative cross-store selector is justified for two *valid but different* documents; legacy LocalStorage remains preferred. Import format 3 migration-pointer and recovery race require further review. No tests were executed, V8.2 remains paused, Phase 1 remains open.

## 2026-10-22 later-autosave Revision guard — no tests
- `956733a0804dff1950f7e30a18a79fdac5fd60d3`: when a format-2 Revision journal remains and the `rd_profiles` snapshot matches its staged checksum while `rd_last` is a valid document, startup retains the newer/current document instead of rolling it back solely because its hash no longer matches the original Revision snapshot.
- OPEN: this conservative retention cannot prove whether a different valid `rd_last` is a later save or a partial interruption. Crash-consistent transaction ownership/monotonic document identity is still needed for definitive resolution.
- OPEN: valid but divergent LocalStorage and IndexedDB snapshots cannot safely be arbitrated from non-atomic sidecar generation alone. Import Format-3 mirror timing and Revision cross-store consistency remain open. No tests; V8.2 remains paused.

## 2026-10-22 invalid local snapshot authority guard — NO TESTS
- `56274a96c74f9a4b37bc768c77810f28cee17c20`: startup Mirror recovery now distinguishes absent `rd_last` from present-but-invalid `rd_last`. Only an absent local snapshot may be automatically recovered from a valid IndexedDB mirror; a present invalid snapshot is preserved and warned about, not silently overwritten. Valid legacy LocalStorage continues to take precedence.
- **OPEN**: this deliberately conservative authority rule does not automatically choose between two distinct valid snapshots, because generations are not an atomic transaction. A user-controlled conflict/recovery flow or a new atomic authority design is needed.
- **OPEN**: Format 3 pending Import journal still has crash/race windows with mirror completion and subsequent edits; Revision's format 2 staging still does not prove cross-store atomicity. Runtime behavior was not tested. V8.2 remains paused; Phase 1 remains open.

## 2026-10-23 ambiguous recovery safeguards (NO TESTS)
- `87d242a835cad418594f7f686bbd3c47b65e0ae0`: Format-3 Import startup recovery will not replay an older undo journal over a differing valid current document when neither staged import hashes nor durable commit marker match. Instead it preserves data and leaves recovery pending with a warning.
- `826ae2bdc44d5e4205a9c3b908b4c67125c1d3b5`: Format-2 Revision startup recovery similarly refuses a destructive rollback over a valid current document if expected revision metadata is incomplete/ambiguous.
- OPEN: The safeguards deliberately stop automated resolution in ambiguous cases; they do not establish a transactional authority or user-guided recovery UI. Valid divergent LocalStorage/IndexedDB states remain conservatively LocalStorage-first. Format-3 async mirror ownership and Revision cross-store atomicity remain open.
- No tests, build, or V8.2 automation changes. Phase 1 remains open pending runtime validation and remaining design work.

# Durable RoomDesigner regression protocol

Canonical state: `audit/regression/checkpoint.json`; inventory: `inventory.json` in
the same directory. Git main is the durable session-independent authority. Read
these files at a freshly resolved main commit before every manual/scheduled run.
Project Evolution remains the product requirements/release ledger, not a second
line-review cursor. No runtime acceptance is implied by this state.

## Exclusive writer and optimistic delivery

1. Read the existing V10 Automation `6aec3b232ca48191ab8341fec2a6502d` including
   recorded run state. Manual work temporarily pauses it, confirms no recorded
   in-progress run, and observes the existing five-minute collision guard. Resume
   the same task after releasing the lock; never create another hourly writer.
2. Before any main/checkpoint mutation, acquire the fixed GitHub branch
   `roomdesigner-regression-lock`. Bootstrap an absent branch by atomic
   create-reference pointing to a unique owner commit. Once present, inspect its
   exact tip commit: only a message beginning `ROOMDESIGNER_REGRESSION_LOCK=FREE`
   is available. Create a child owner commit (same tree) with owner, timestamp and
   source HEAD in its message, then update_ref with expected_sha=free-tip and
   force=false. Continue only after readback proves ownership. An owned/unknown
   tip or rejected lease means BLOCKED_CONCURRENCY; never treat an existing
   branch as successful acquisition or use an upsert. Reading is allowed.
   No automatic expiry/stealing: a crashed owner requires explicit reconciliation
   of the recorded run and owner before manual release.
3. Immediately re-read main and affected blob SHAs before editing and before
   publishing. A changed HEAD invalidates the candidate; fetch and re-review.
   Commit source, inventory and checkpoint together. Use a normal fast-forward
   push from that exact parent, or update_ref with expected_sha and force=false.
   Never force-push/rebase over an intervening writer. A rejected push is a
   conflict, not permission to retry with old checkpoint data.
4. Independently read final GitHub HEAD/commit and checkpoint blobs. Verify the
   lock still identifies this owner. Release by creating its child commit (same
   tree), message beginning `ROOMDESIGNER_REGRESSION_LOCK=FREE`, and update_ref
   with expected_sha=owned-tip and force=false; read back the free tip. Keep this
   lock branch as an append-only coordination ledger. Release on failure too when
   ownership is certain, and resume the existing schedule. Pausing a schedule
   alone does not cancel an already running worker. Never release another owner.

## Inventory, coverage and continuation

Generate the deterministic manifest from pinned Git blobs, without running code:
`python tools/regression-inventory.py --ref <verified-HEAD>`.
For an atomic candidate commit, stage all changes first, then run
`python tools/regression-inventory.py --staged > audit/regression/inventory.json`.
Stage that manifest and the checkpoint before committing. This is file metadata
maintenance, not a test/build. The two state files exclude themselves to avoid
self-referential hashes; every other tracked file has its exact blob and category.

Review source/configuration and test source statically in manifest path order;
vendor, binary/reference and generated dependency locks are excluded from the
default cursor, but may be inspected for an evidenced dependency. Product data
files are included. Never execute tests or builds. Read at most 200 actual lines
per segment. A long/minified line must be completely read in bounded character
slices before crediting that line. Truncated output receives no coverage credit.

Each segment stores path, blob SHA, inclusive actual read and reviewed ranges,
status, findings, timestamp and source HEAD. Missing segments mean UNREAD, never
implicitly reviewed. Focused reviews may be out of order; the sequential cursor
always points to the earliest uncovered eligible line. Do not credit earlier
chat reports that cannot be tied to actual non-truncated reads and exact blobs.

On any blob change, retain old review records as history but mark them stale and
restart coverage for the new blob at line 1 (unless this session explicitly reads
the new content). Removed paths become tombstones; new paths start UNREAD.
Preserve unresolved findings across runs. Record last completed segment and next
exact segment. A segment's source HEAD identifies its review baseline; the commit
containing the state identifies delivery (no self-referential commit SHA).

Checkpoint-only maintenance uses Persian infrastructure commit messages and does
not increment product version. A genuine source correction increments V<number>-R
sequentially, preserves numeric package/cache conventions, and updates HTML,
package metadata and Project Evolution together. Source fixes remain runtime
pending until the user accepts them.

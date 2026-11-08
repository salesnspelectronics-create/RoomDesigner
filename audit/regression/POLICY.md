# Durable RoomDesigner regression protocol

Canonical state: `audit/regression/checkpoint.json`; inventory: `inventory.json` in
the same directory. Git main is the durable session-independent authority. Read
these files at a freshly resolved main commit before every manual/scheduled run.
Project Evolution remains the product requirements/release ledger, not a second
line-review cursor. No runtime acceptance is implied by this state.

## Direct delivery without advisory lock

The repository advisory regression lock, lock branch ownership, lease commits, automatic expiry, five-minute manual collision guard, and schedule pausing for lock acquisition are abolished by explicit owner instruction (2026-11-08). Do not acquire, inspect, require, or release `roomdesigner-regression-lock` for regression work. Do not interpret an automation's own `in_progress` status as a competing Git writer.

Before any mutation, read current `main` and affected file blob SHAs. Prepare changes against that exact baseline, and publish only via a non-force fast-forward update with `expected_sha` (or equivalent optimistic concurrency check). If `main` or any affected blob changes, stop and re-review the candidate against the new state. Never overwrite concurrent edits or force-push. Keep the existing single hourly automation; do not create duplicate writers. Source fixes, version metadata, inventory, and checkpoint must be committed together when possible; verify the resulting `main` HEAD and file contents independently.

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

## Historical lock records (inactive)

Earlier lock/lease commits and checkpoint owner fields are historical audit records only. They impose no current acquisition, release, or manual collision requirements. No new lock commits should be created.

---

## "di-craft": patch

Add `createSnapshotBus` to `di-craft/hydration`: a short-lived holder for streamed snapshots that arrive before their consumers mount, with a 30-second default TTL and lazy expiration.

import type {
	HydrationSchema,
	HydrationSnapshot,
	SnapshotBus,
	SnapshotBusOptions,
} from "./types";

// Retention window for delivered-but-unread snapshots: short enough to bound
// memory, long enough for a dialog or tab opened right after a streamed render
// to still find the data the page already received.
const DEFAULT_TTL_MS = 30_000;

type BusEntry = {
	readonly snapshot: unknown;
	readonly expiresAt: number;
};

class SnapshotBusClass implements SnapshotBus {
	// Keyed by schema reference so snapshot types stay inferable at both ends.
	private readonly entries = new Map<HydrationSchema, BusEntry>();
	private readonly ttl: number;
	private readonly now: () => number;

	constructor(options: SnapshotBusOptions) {
		this.ttl = options.ttl ?? DEFAULT_TTL_MS;
		this.now = options.now ?? Date.now;
	}

	push<TSchema extends HydrationSchema>(
		schema: TSchema,
		snapshot: HydrationSnapshot<TSchema>,
	): void {
		this.sweep();
		this.entries.set(schema, {
			snapshot,
			expiresAt: this.now() + this.ttl,
		});
	}

	pull<TSchema extends HydrationSchema>(
		schema: TSchema,
	): HydrationSnapshot<TSchema> | undefined {
		const entry = this.entries.get(schema);

		if (entry === undefined) {
			return undefined;
		}

		if (entry.expiresAt <= this.now()) {
			this.entries.delete(schema);
			return undefined;
		}

		return entry.snapshot as HydrationSnapshot<TSchema>;
	}

	delete(schema: HydrationSchema): boolean {
		const entry = this.entries.get(schema);

		if (entry === undefined) {
			return false;
		}

		// Expired entries are already logically gone: drop them for memory
		// hygiene, but report that no live snapshot was removed.
		this.entries.delete(schema);

		return entry.expiresAt > this.now();
	}

	clear(): void {
		this.entries.clear();
	}

	// Lazy expiration on write keeps the bus timer-free; reads only check the
	// single entry they touch.
	private sweep(): void {
		const now = this.now();

		for (const [schema, entry] of this.entries) {
			if (entry.expiresAt <= now) {
				this.entries.delete(schema);
			}
		}
	}
}

/**
 * Creates a short-lived holder for snapshots that arrived before their
 * consumers mounted.
 *
 * Push each streamed snapshot as it is delivered, and pull it when a late
 * consumer — a dialog, a tab, or a lazily mounted component — wants to hydrate
 * without refetching. Entries expire after `ttl` milliseconds (30 seconds by
 * default); expiration is lazy, so the bus never schedules timers.
 *
 * @example
 * ```ts
 * const snapshots = createSnapshotBus();
 *
 * // When the streamed snapshot arrives:
 * snapshots.push(conversation, snapshot);
 *
 * // When a dialog mounts later:
 * const cached = snapshots.pull(conversation);
 * if (cached !== undefined) {
 *   hydrate({ container: clientContainer, schema: conversation, snapshot: cached });
 * }
 * ```
 *
 * @param options - Time to live and clock overrides.
 * @returns An empty snapshot bus.
 */
export const createSnapshotBus = (
	options: SnapshotBusOptions = {},
): SnapshotBus => new SnapshotBusClass(options);

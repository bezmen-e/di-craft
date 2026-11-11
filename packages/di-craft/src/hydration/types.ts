import type { Container } from "../core/container";
import type { Token } from "../core/token";

/** Primitive value that can safely cross a server/client boundary. */
export type SerializablePrimitive = string | number | boolean | null;

/**
 * JSON-like value that can safely cross a server/client boundary.
 */
export type Serializable =
	| SerializablePrimitive
	| readonly Serializable[]
	| { readonly [key: string]: Serializable };

/**
 * Entity that can expose and restore a serializable state snapshot.
 *
 * The snapshot, not the DI container, is what crosses the boundary between a
 * server render and a client container.
 */
export type Hydratable<TSnapshot extends Serializable> = {
	/**
	 * Returns the minimal serializable state needed by the client.
	 */
	dehydrate(): TSnapshot;
	/**
	 * Restores state from a previously serialized snapshot.
	 */
	hydrate(snapshot: TSnapshot): void;
};

/**
 * Named hydratable tokens that define a client-boundary snapshot shape.
 *
 * Use it with `satisfies` to validate the schema without losing literal keys or
 * token-specific snapshot inference.
 *
 * @example
 * ```ts
 * const hydration = {
 *   user: USER_STATE,
 * } satisfies HydrationSchema;
 * ```
 */
export type HydrationSchema = Readonly<
	Record<string, Token<Hydratable<Serializable>>>
>;

/**
 * Snapshot object inferred from a hydration schema.
 */
export type HydrationSnapshot<TSchema extends HydrationSchema> = {
	readonly [TKey in keyof TSchema]: TSchema[TKey] extends Token<
		Hydratable<infer TSnapshot>
	>
		? TSnapshot
		: never;
};

/**
 * Options for reading a serializable snapshot from a container.
 */
export type DehydrateOptions<TSchema extends HydrationSchema> = {
	/**
	 * Container that owns the hydratable state entities.
	 */
	readonly container: Container;
	/**
	 * Hydratable tokens keyed by snapshot field name.
	 */
	readonly schema: TSchema;
};

/**
 * Options for restoring a serializable snapshot into a container.
 */
export type HydrateOptions<TSchema extends HydrationSchema> =
	DehydrateOptions<TSchema> & {
		/**
		 * Serializable state produced by `dehydrate` for the same schema.
		 */
		readonly snapshot: HydrationSnapshot<TSchema>;
	};

/**
 * Options for `createSnapshotBus`.
 */
export type SnapshotBusOptions = {
	/**
	 * How long a pushed snapshot stays readable, in milliseconds. Pushing the
	 * same schema again resets its remaining time.
	 *
	 * @defaultValue `30_000`
	 */
	readonly ttl?: number;
	/**
	 * Clock used to age entries. Override it for deterministic tests.
	 *
	 * @defaultValue `Date.now`
	 */
	readonly now?: () => number;
};

/**
 * Short-lived holder for snapshots that arrived before their consumers.
 *
 * A streamed snapshot can be delivered before the component that needs it
 * mounts, for example a dialog opened seconds after the page rendered. The bus
 * keeps such snapshots readable for a limited time so late consumers can
 * hydrate without refetching. Entries expire lazily; the bus never schedules
 * timers, so it is safe in every runtime.
 */
export type SnapshotBus = {
	/**
	 * Stores a snapshot for a schema, replacing any previous one and resetting
	 * its time to live. The schema object itself is the key, so it must be a
	 * stable reference shared by the pushing and pulling code.
	 */
	push<TSchema extends HydrationSchema>(
		schema: TSchema,
		snapshot: HydrationSnapshot<TSchema>,
	): void;
	/**
	 * Returns the stored snapshot for a schema, or `undefined` when nothing was
	 * pushed for it or its time to live has elapsed. Reading does not remove
	 * the entry, so several late consumers can hydrate from one snapshot.
	 */
	pull<TSchema extends HydrationSchema>(
		schema: TSchema,
	): HydrationSnapshot<TSchema> | undefined;
	/**
	 * Removes the snapshot stored for a schema. Returns `true` when a live
	 * snapshot was removed; expired entries count as already gone, matching
	 * `pull`.
	 */
	delete(schema: HydrationSchema): boolean;
	/**
	 * Removes every stored snapshot.
	 */
	clear(): void;
};

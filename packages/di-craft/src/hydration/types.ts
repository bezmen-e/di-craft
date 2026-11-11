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

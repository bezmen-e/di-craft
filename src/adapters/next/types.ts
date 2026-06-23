import type { Container } from "../../core/container";
import type { Provider } from "../../core/provider";
import type { Token } from "../../core/token";

/**
 * Minimal shape of React's `cache` function needed by the adapter.
 *
 * Passing it in keeps React out of di-craft's dependency graph while still
 * letting React/Next own the current request cache.
 *
 * @example
 * ```ts
 * import { cache } from "react";
 *
 * createNextDi({ cache, providers });
 * ```
 */
export type RequestCache = <T>(factory: () => T) => () => T;

/**
 * Options for `createNextDi`.
 */
export type CreateNextDiOptions = {
	/**
	 * Providers registered once in the root server container.
	 */
	readonly providers?: readonly Provider[];
	/**
	 * React request cache, imported from `react` in a Next server file.
	 */
	readonly cache: RequestCache;
	/**
	 * Providers registered in each request-scoped child container.
	 */
	readonly requestProviders?: () => readonly Provider[];
};

/**
 * Options for running work inside a fresh request-scoped child container.
 */
export type RunWithRequestContainerOptions<TResult> = {
	/**
	 * Extra providers registered only for this manual request container.
	 */
	readonly providers?: readonly Provider[];
	/**
	 * Work that owns the request lifecycle. The container is disposed after this
	 * callback settles.
	 */
	readonly run: (container: Container) => TResult | Promise<TResult>;
};

/**
 * Next.js server adapter instance created by `createNextDi`.
 */
export type NextDiAdapter = {
	/**
	 * Returns the long-lived root server container.
	 */
	readonly getRootContainer: () => Container;
	/**
	 * Returns the current request-scoped child container.
	 */
	readonly getRequestContainer: () => Container;
	/**
	 * Creates a fresh child container manually, useful in route handlers or tests.
	 */
	readonly createRequestContainer: (
		providers?: readonly Provider[],
	) => Container;
	/**
	 * Runs work inside a fresh child container and disposes it in a `finally`
	 * block. Use this in Route Handlers, Server Actions, or tests where the
	 * request lifecycle is explicit.
	 */
	readonly runWithRequestContainer: <TResult>(
		options: RunWithRequestContainerOptions<TResult>,
	) => Promise<Awaited<TResult>>;
	/**
	 * Disposes cached instances owned by the root container.
	 */
	readonly disposeRootContainer: () => Promise<void>;
};

export type SerializablePrimitive = string | number | boolean | null;

/**
 * JSON-like value that can safely cross a Server Component boundary.
 */
export type Serializable =
	| SerializablePrimitive
	| readonly Serializable[]
	| { readonly [key: string]: Serializable };

/**
 * Entity that can expose and restore a serializable state snapshot.
 *
 * The snapshot, not the DI container, is what crosses the RSC/client boundary.
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

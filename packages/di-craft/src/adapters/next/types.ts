import type { Container } from "../../core/container";
import type { Provider } from "../../core/provider";

export type {
	DehydrateOptions,
	Hydratable,
	HydrateOptions,
	HydrationSchema,
	HydrationSnapshot,
	Serializable,
	SerializablePrimitive,
} from "../../hydration";

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
 *
 * `TContext` is the per-request metadata type your application passes into an
 * explicit scope, such as an audience classification decided by middleware.
 */
export type CreateNextDiOptions<TContext = undefined> = {
	/**
	 * Providers registered once in the root server container.
	 */
	readonly providers?: readonly Provider[];
	/**
	 * React render cache, imported from `react` in a Next server file.
	 */
	readonly cache: RequestCache;
	/**
	 * Providers registered in each RSC render-scoped child container.
	 *
	 * Receives the context passed to `runWithRequestContainer` or
	 * `createRequestContainer`. An RSC render pass carries no request metadata,
	 * so `getRequestContainer()` always provides `undefined`.
	 */
	readonly requestProviders?: (
		context: TContext | undefined,
	) => readonly Provider[];
};

/**
 * Options for running work inside a fresh explicit child container.
 */
export type RunWithRequestContainerOptions<TResult, TContext = undefined> = {
	/**
	 * Extra providers registered only for this manual request container.
	 */
	readonly providers?: readonly Provider[];
	/**
	 * Request metadata forwarded to `requestProviders` for this scope, such as
	 * an audience classification decided by your middleware.
	 */
	readonly context?: TContext;
	/**
	 * Work that owns the request lifecycle. The container is disposed after this
	 * callback settles.
	 */
	readonly run: (container: Container) => TResult | Promise<TResult>;
};

/**
 * Next.js server adapter instance created by `createNextDi`.
 */
export type NextDiAdapter<TContext = undefined> = {
	/**
	 * Returns the long-lived root server container.
	 */
	readonly getRootContainer: () => Container;
	/**
	 * Returns the current RSC render-scoped child container.
	 */
	readonly getRequestContainer: () => Container;
	/**
	 * Creates a fresh child container manually, useful in route handlers or tests.
	 * The optional context is forwarded to `requestProviders`.
	 */
	readonly createRequestContainer: (
		providers?: readonly Provider[],
		context?: TContext,
	) => Container;
	/**
	 * Runs work inside a fresh child container and disposes it in a `finally`
	 * block. This does not bind the container to async context; use the callback
	 * argument, or `di-craft/node` when nested async code should call
	 * `getRequestContainer()`.
	 */
	readonly runWithRequestContainer: <TResult>(
		options: RunWithRequestContainerOptions<TResult, TContext>,
	) => Promise<Awaited<TResult>>;
	/**
	 * Disposes cached instances owned by the root container.
	 */
	readonly disposeRootContainer: () => Promise<void>;
};

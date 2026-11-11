import type { Container } from "../../core/container";
import type { Provider } from "../../core/provider";

/**
 * Options for `createNodeDi`.
 *
 * `TContext` is the per-request metadata type your application passes into a
 * scope, such as an audience classification or a request id.
 */
export type CreateNodeDiOptions<TContext = undefined> = {
	/**
	 * Providers registered once in the root container.
	 */
	readonly providers?: readonly Provider[];
	/**
	 * Providers registered in each async request-scoped child container.
	 *
	 * Receives the context passed to `runWithRequestContainer` or
	 * `createRequestContainer`, or `undefined` when the scope was created
	 * without one.
	 */
	readonly requestProviders?: (
		context: TContext | undefined,
	) => readonly Provider[];
};

/**
 * Options for running work inside an AsyncLocalStorage-backed child container.
 */
export type RunWithRequestContainerOptions<TResult, TContext = undefined> = {
	/**
	 * Extra providers registered only for this request container.
	 */
	readonly providers?: readonly Provider[];
	/**
	 * Request metadata forwarded to `requestProviders` for this scope, such as
	 * an audience classification decided by your middleware.
	 */
	readonly context?: TContext;
	/**
	 * Work that runs inside the current async request scope. Await all work that
	 * reads the request container before this callback settles. Deferred work,
	 * such as a Next.js `after` callback, must enter a fresh request scope.
	 */
	readonly run: (container: Container) => TResult | Promise<TResult>;
};

/**
 * Node.js AsyncLocalStorage adapter instance created by `createNodeDi`.
 */
export type NodeDiAdapter<TContext = undefined> = {
	/**
	 * Returns the long-lived root container.
	 */
	readonly getRootContainer: () => Container;
	/**
	 * Returns the container bound to the current async request scope.
	 *
	 * @throws `NodeRequestScopeError` outside an active request scope or after it
	 * has been disposed.
	 */
	readonly getRequestContainer: () => Container;
	/**
	 * Creates a fresh child container without binding it to async context.
	 * The optional context is forwarded to `requestProviders`.
	 */
	readonly createRequestContainer: (
		extraProviders?: readonly Provider[],
		context?: TContext,
	) => Container;
	/**
	 * Runs work inside a fresh child container, binds it to AsyncLocalStorage,
	 * and disposes it after the callback settles.
	 */
	readonly runWithRequestContainer: <TResult>(
		options: RunWithRequestContainerOptions<TResult, TContext>,
	) => Promise<Awaited<TResult>>;
	/**
	 * Disposes cached instances owned by the root container.
	 */
	readonly disposeRootContainer: () => Promise<void>;
};

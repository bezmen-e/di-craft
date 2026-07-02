import type { Container } from "../../core/container";
import type { Provider } from "../../core/provider";

/**
 * Options for `createNodeDi`.
 */
export type CreateNodeDiOptions = {
	/**
	 * Providers registered once in the root container.
	 */
	readonly providers?: readonly Provider[];
	/**
	 * Providers registered in each async request-scoped child container.
	 */
	readonly requestProviders?: () => readonly Provider[];
};

/**
 * Options for running work inside an AsyncLocalStorage-backed child container.
 */
export type RunWithRequestContainerOptions<TResult> = {
	/**
	 * Extra providers registered only for this request container.
	 */
	readonly providers?: readonly Provider[];
	/**
	 * Work that runs inside the current async request scope.
	 */
	readonly run: (container: Container) => TResult | Promise<TResult>;
};

/**
 * Node.js AsyncLocalStorage adapter instance created by `createNodeDi`.
 */
export type NodeDiAdapter = {
	/**
	 * Returns the long-lived root container.
	 */
	readonly getRootContainer: () => Container;
	/**
	 * Returns the container bound to the current async request scope.
	 */
	readonly getRequestContainer: () => Container;
	/**
	 * Creates a fresh child container without binding it to async context.
	 */
	readonly createRequestContainer: (
		providers?: readonly Provider[],
	) => Container;
	/**
	 * Runs work inside a fresh child container, binds it to AsyncLocalStorage,
	 * and disposes it after the callback settles.
	 */
	readonly runWithRequestContainer: <TResult>(
		options: RunWithRequestContainerOptions<TResult>,
	) => Promise<Awaited<TResult>>;
	/**
	 * Disposes cached instances owned by the root container.
	 */
	readonly disposeRootContainer: () => Promise<void>;
};

/**
 * Node.js AsyncLocalStorage adapter for explicit async request scopes.
 *
 * @module
 */

import { AsyncLocalStorage } from "node:async_hooks";

import type { Container } from "../../core/container";
import { createChildContainer, createContainer } from "../../core/container";
import type { Provider } from "../../core/provider";
import { NodeRequestScopeError } from "./errors";
import type {
	CreateNodeDiOptions,
	NodeDiAdapter,
	RunWithRequestContainerOptions,
} from "./types";

type RequestScope = {
	readonly container: Container;
	active: boolean;
};

export { NodeRequestScopeError } from "./errors";
export type {
	CreateNodeDiOptions,
	NodeDiAdapter,
	RunWithRequestContainerOptions,
} from "./types";

/**
 * Creates a Node.js adapter backed by `AsyncLocalStorage`.
 *
 * Use this for explicit async scopes such as route handlers, server actions,
 * jobs, and plain server code. React Server Components should keep using the
 * Next adapter with React's `cache` primitive.
 *
 * Await all async work that reads the request container before the callback
 * passed to `runWithRequestContainer` settles. The request container is disposed
 * immediately after that callback settles. Deferred work, including callbacks
 * registered with Next.js `after`, must enter a fresh request scope.
 *
 * @param options - Root and per-request providers for this adapter instance.
 * @returns Helpers for root access and AsyncLocalStorage-backed request scopes.
 */
export const createNodeDi = ({
	providers: rootProviders = [],
	requestProviders,
}: CreateNodeDiOptions = {}): NodeDiAdapter => {
	const storage = new AsyncLocalStorage<RequestScope>();
	const rootContainer = createContainer(rootProviders);
	const createRequestContainer = (
		extraProviders: readonly Provider[] = [],
	): Container =>
		createChildContainer(rootContainer, [
			...(requestProviders?.() ?? []),
			...extraProviders,
		]);

	const getRootContainer = (): Container => rootContainer;

	const getRequestContainer = (): Container => {
		const requestScope = storage.getStore();
		const isMissingRequestContainer =
			requestScope === undefined || !requestScope.active;

		if (isMissingRequestContainer) {
			throw new NodeRequestScopeError();
		}

		return requestScope.container;
	};

	const runWithRequestContainer = async <TResult>({
		providers: extraProviders = [],
		run,
	}: RunWithRequestContainerOptions<TResult>): Promise<Awaited<TResult>> => {
		const container = createRequestContainer(extraProviders);
		const requestScope: RequestScope = { active: true, container };

		return await storage.run(requestScope, async () => {
			try {
				return await run(container);
			} finally {
				try {
					await container.dispose();
				} finally {
					requestScope.active = false;
				}
			}
		});
	};

	const disposeRootContainer = (): Promise<void> => rootContainer.dispose();

	return {
		getRootContainer,
		getRequestContainer,
		createRequestContainer,
		runWithRequestContainer,
		disposeRootContainer,
	};
};

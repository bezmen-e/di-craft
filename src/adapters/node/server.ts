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
 */
export const createNodeDi = ({
	providers: rootProviders = [],
	requestProviders,
}: CreateNodeDiOptions = {}): NodeDiAdapter => {
	const storage = new AsyncLocalStorage<Container>();
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
		const container = storage.getStore();
		const isMissingRequestContainer = container === undefined;

		if (isMissingRequestContainer) {
			throw new NodeRequestScopeError();
		}

		return container;
	};

	const runWithRequestContainer = async <TResult>({
		providers: extraProviders = [],
		run,
	}: RunWithRequestContainerOptions<TResult>): Promise<Awaited<TResult>> => {
		const container = createRequestContainer(extraProviders);

		return await storage.run(container, async () => {
			try {
				return await run(container);
			} finally {
				await container.dispose();
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

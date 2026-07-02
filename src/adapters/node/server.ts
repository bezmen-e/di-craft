/**
 * Node.js AsyncLocalStorage adapter for explicit async request scopes.
 *
 * @module
 */

import { AsyncLocalStorage } from "node:async_hooks";
import type { Container } from "../../core/container";
import { createChildContainer, createContainer } from "../../core/container";
import type { Provider } from "../../core/provider";
import type {
	CreateNodeDiOptions,
	NodeDiAdapter,
	RunWithRequestContainerOptions,
} from "./types";

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
	providers = [],
	requestProviders,
}: CreateNodeDiOptions = {}): NodeDiAdapter => {
	const storage = new AsyncLocalStorage<Container>();
	const rootContainer = createContainer(providers);
	const createRequestContainer = (
		providers: readonly Provider[] = [],
	): Container =>
		createChildContainer(rootContainer, [
			...(requestProviders?.() ?? []),
			...providers,
		]);

	return {
		getRootContainer: () => rootContainer,
		getRequestContainer: () => {
			const container = storage.getStore();
			const isMissingRequestContainer = container === undefined;

			if (isMissingRequestContainer) {
				throw new Error(
					"di-craft/node getRequestContainer() was called outside runWithRequestContainer().",
				);
			}

			return container;
		},
		createRequestContainer,
		runWithRequestContainer: async <TResult>({
			providers = [],
			run,
		}: RunWithRequestContainerOptions<TResult>): Promise<Awaited<TResult>> => {
			const container = createRequestContainer(providers);

			try {
				return await storage.run(container, () => run(container));
			} finally {
				await container.dispose();
			}
		},
		disposeRootContainer: () => rootContainer.dispose(),
	};
};

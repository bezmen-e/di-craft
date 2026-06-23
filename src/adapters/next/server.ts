/**
 * Server-side Next.js App Router adapter for request-scoped containers.
 *
 * @module
 */

import type { Container } from "../../core/container";
import { createChildContainer, createContainer } from "../../core/container";
import type { Provider } from "../../core/provider";
import type {
	CreateNextDiOptions,
	NextDiAdapter,
	RunWithRequestContainerOptions,
} from "./types";

export { dehydrate } from "./hydration";
export type {
	CreateNextDiOptions,
	DehydrateOptions,
	Hydratable,
	HydrationSchema,
	HydrationSnapshot,
	NextDiAdapter,
	RequestCache,
	RunWithRequestContainerOptions,
	Serializable,
	SerializablePrimitive,
} from "./types";

const assertServerRuntime = (): void => {
	if ("window" in globalThis) {
		throw new Error(
			"di-craft/next/server can only be used in a server runtime.",
		);
	}
};

/**
 * Creates a server adapter for Next.js App Router and React Server Components.
 *
 * The root container is created once. `getRequestContainer` creates a child
 * container through the provided React request cache, so repeated calls inside
 * one RSC request resolve through the same scoped dependency graph.
 *
 * Import this helper from a server-only composition file. The adapter does not
 * import React itself; pass `cache` from `react` so React/Next owns request
 * memoization.
 *
 * @example
 * ```ts
 * import "server-only";
 * import { cache } from "react";
 * import { createNextDi } from "di-craft/next/server";
 *
 * export const { getRequestContainer } = createNextDi({
 *   cache,
 *   providers,
 * });
 * ```
 */
export const createNextDi = ({
	cache,
	providers = [],
	requestProviders,
}: CreateNextDiOptions): NextDiAdapter => {
	assertServerRuntime();

	const rootContainer = createContainer(providers);
	const createRequestContainer = (
		providers: readonly Provider[] = [],
	): Container =>
		createChildContainer(rootContainer, [
			...(requestProviders?.() ?? []),
			...providers,
		]);
	const getRequestContainer = cache(() => createRequestContainer());

	return {
		getRootContainer: () => rootContainer,
		getRequestContainer,
		createRequestContainer,
		runWithRequestContainer: async <TResult>({
			providers = [],
			run,
		}: RunWithRequestContainerOptions<TResult>): Promise<Awaited<TResult>> => {
			const container = createRequestContainer(providers);

			try {
				return await run(container);
			} finally {
				await container.dispose();
			}
		},
		disposeRootContainer: () => rootContainer.dispose(),
	};
};

/**
 * Server-side Next.js App Router adapter for RSC render-scoped containers.
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
 * one RSC render pass resolve through the same scoped dependency graph.
 *
 * Import this helper from a server-only composition file. The adapter does not
 * import React itself; pass `cache` from `react` so React/Next owns render
 * memoization.
 *
 * The `context` passed to `runWithRequestContainer` or `createRequestContainer`
 * is forwarded to `requestProviders`, so each kind of request can register a
 * different provider set. An RSC render pass carries no request metadata, so
 * the cached `getRequestContainer` always resolves without one.
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
 *
 * @param options - React cache function and providers for the server adapter.
 * @returns Helpers for root, render-scoped, and explicit request containers.
 * @throws `Error` when called in a browser runtime.
 */
export const createNextDi = <TContext = undefined>({
	cache,
	providers = [],
	requestProviders,
}: CreateNextDiOptions<TContext>): NextDiAdapter<TContext> => {
	assertServerRuntime();

	const rootContainer = createContainer(providers);
	const createRequestContainer = (
		providers: readonly Provider[] = [],
		context?: TContext,
	): Container =>
		createChildContainer(rootContainer, [
			...(requestProviders?.(context) ?? []),
			...providers,
		]);
	// An RSC render pass carries no request metadata, so the cached render
	// container is always created without a context.
	const getRequestContainer = cache(() => createRequestContainer());

	return {
		getRootContainer: () => rootContainer,
		getRequestContainer,
		createRequestContainer,
		runWithRequestContainer: async <TResult>({
			providers = [],
			context,
			run,
		}: RunWithRequestContainerOptions<TResult, TContext>): Promise<
			Awaited<TResult>
		> => {
			const container = createRequestContainer(providers, context);

			try {
				return await run(container);
			} finally {
				await container.dispose();
			}
		},
		disposeRootContainer: () => rootContainer.dispose(),
	};
};

import type { OptionalDependency, Provider } from "../provider";
import type { RegisterOptions } from "../registry";
import type { Token } from "../token";

/**
 * Container that stores providers and resolves typed dependencies.
 */
export type Container = {
	/**
	 * Registers a provider in this container.
	 *
	 * Pass `{ allowOverride: true }` to intentionally replace an existing
	 * provider for the same token.
	 *
	 * @throws `DuplicateProviderError` when the token is already registered.
	 * @throws `InvalidProviderError` when overriding a live disposable instance.
	 */
	register(provider: Provider, options?: RegisterOptions): void;
	/**
	 * Resolves a required token.
	 *
	 * Throws `MissingProviderError` when no provider exists in this container or
	 * any parent container.
	 *
	 * @throws `MissingProviderError` when no provider exists.
	 * @throws `CircularDependencyError` when the dependency graph contains a cycle.
	 * @throws `InvalidProviderError` when provider lifetimes are incompatible.
	 */
	get<T>(token: Token<T>): T;
	/**
	 * Resolves an optional dependency.
	 *
	 * Returns `undefined` when no provider exists in this container or any parent
	 * container.
	 */
	get<T>(dependency: OptionalDependency<T>): T | undefined;
	/**
	 * Checks whether this container or one of its parents has a provider.
	 */
	has(token: Token<unknown>): boolean;
	/**
	 * Disposes cached instances owned by this container.
	 *
	 * Disposal hooks run in reverse creation order. Calling `dispose` more than
	 * once is safe.
	 */
	dispose(): Promise<void>;
};

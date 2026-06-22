import {
	type Dependency,
	InvalidProviderError,
	isOptionalDependency,
	type OptionalDependency,
	type Provider,
} from "../provider";
import {
	createRegistry,
	type RegisterOptions,
	type Registry,
} from "../registry";
import { createResolver, type Resolver } from "../resolver";
import type { Token } from "../token";
import type { Container } from "./types";

class ContainerClass implements Container {
	private readonly registry: Registry;
	private readonly resolver: Resolver;
	private readonly parent: ContainerClass | undefined;

	constructor(providers: readonly Provider[] = [], parent?: ContainerClass) {
		this.parent = parent;
		this.registry = createRegistry();

		for (const provider of providers) {
			this.registry.register(provider);
		}

		this.resolver = createResolver(this.registry, parent?.resolver);
	}

	register(provider: Provider, options?: RegisterOptions): void {
		// Don't silently drop a live disposable instance; require explicit dispose.
		if (
			options?.allowOverride &&
			this.resolver.hasDisposableInstance(provider.provide)
		) {
			throw new InvalidProviderError(
				`Cannot override token "${provider.provide.name}": its instance was already created and has an onDispose hook. Dispose the container before replacing it.`,
			);
		}

		const overridden = this.registry.register(provider, options);

		if (overridden) {
			this.resolver.invalidate(provider.provide);
		}
	}

	get<T>(token: Token<T>): T;
	get<T>(dependency: OptionalDependency<T>): T | undefined;
	get<T>(dependency: Dependency<T>): T | undefined {
		if (isOptionalDependency(dependency)) {
			return this.resolver.resolveOptional(dependency.token);
		}

		return this.resolver.resolve(dependency);
	}

	has(token: Token<unknown>): boolean {
		return this.registry.has(token) || (this.parent?.has(token) ?? false);
	}

	dispose(): Promise<void> {
		return this.resolver.dispose();
	}
}

/**
 * Creates a root container with optional initial providers.
 *
 * Root containers own singleton instances for providers registered in them.
 */
export const createContainer = (
	providers: readonly Provider[] = [],
): Container => new ContainerClass(providers);

/**
 * Creates a child container that can resolve providers from its parent.
 *
 * Child containers may register their own providers while still reusing parent
 * providers. Scoped providers create one cached instance per resolving child.
 */
export const createChildContainer = (
	parent: Container,
	providers: readonly Provider[] = [],
): Container => new ContainerClass(providers, parent as ContainerClass);

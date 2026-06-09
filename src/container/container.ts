import { InvalidProviderError, type Provider } from "../provider";
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
		// Refuse to silently drop a live instance that owns resources: the caller
		// must dispose the container before replacing such a provider.
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

	get<T>(token: Token<T>): T {
		return this.resolver.resolve(token);
	}

	has(token: Token<unknown>): boolean {
		return this.registry.has(token) || (this.parent?.has(token) ?? false);
	}

	dispose(): Promise<void> {
		return this.resolver.dispose();
	}
}

export const createContainer = (
	providers: readonly Provider[] = [],
): Container => new ContainerClass(providers);

export const createChildContainer = (
	parent: Container,
	providers: readonly Provider[] = [],
): Container => new ContainerClass(providers, parent as ContainerClass);

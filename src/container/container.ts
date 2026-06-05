import type { Provider } from "../provider";
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

	constructor(providers: readonly Provider[] = []) {
		this.registry = createRegistry();

		for (const provider of providers) {
			this.registry.register(provider);
		}

		this.resolver = createResolver(this.registry);
	}

	register(provider: Provider, options?: RegisterOptions): void {
		this.registry.register(provider, options);

		if (options?.allowOverride) {
			this.resolver.invalidate(provider.provide);
		}
	}

	get<T>(token: Token<T>): T {
		return this.resolver.resolve(token);
	}

	has(token: Token<unknown>): boolean {
		return this.registry.has(token);
	}
}

export const createContainer = (
	providers: readonly Provider[] = [],
): Container => new ContainerClass(providers);

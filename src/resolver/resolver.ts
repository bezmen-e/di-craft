import type { DepsMap, ResolveDeps, Scope } from "../provider";
import { isFactoryProvider, isValueProvider } from "../provider";
import type { Registry } from "../registry";
import type { Token } from "../token";
import { InvalidDependencyError, MissingProviderError } from "./errors";
import type { Resolver } from "./types";

class ResolverClass implements Resolver {
	private readonly registry: Registry;
	private readonly instances = new Map<symbol, unknown>();

	constructor(registry: Registry) {
		this.registry = registry;
	}

	resolve<T>(token: Token<T>): T {
		const provider = this.registry.get(token);

		if (!provider) {
			throw new MissingProviderError(token.name);
		}

		if (isValueProvider(provider)) {
			return provider.useValue as T;
		}

		if (isFactoryProvider(provider)) {
			const scope: Scope = provider.scope ?? "singleton";

			if (scope === "singleton" && this.instances.has(token.id)) {
				return this.instances.get(token.id) as T;
			}

			const deps = this.resolveDeps(provider.deps);
			const value = provider.useFactory(deps) as T;

			if (scope === "singleton") {
				this.instances.set(token.id, value);
			}

			return value;
		}

		throw new MissingProviderError(token.name);
	}

	private resolveDeps<TDeps extends DepsMap>(
		deps: TDeps | undefined,
	): ResolveDeps<TDeps> {
		if (!deps) {
			return {} as ResolveDeps<TDeps>;
		}

		const resolvedDeps: Partial<ResolveDeps<TDeps>> = {};

		for (const key of Object.keys(deps) as Array<keyof TDeps>) {
			const token = deps[key];

			if (token === undefined) {
				throw new InvalidDependencyError(String(key));
			}

			resolvedDeps[key] = this.resolve(token) as ResolveDeps<TDeps>[typeof key];
		}

		return resolvedDeps as ResolveDeps<TDeps>;
	}
}

export const createResolver = (registry: Registry): Resolver =>
	new ResolverClass(registry);

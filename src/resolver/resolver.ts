import type { DepsMap, ResolveDeps } from "../provider";
import { isFactoryProvider, isValueProvider } from "../provider";
import type { Registry } from "../registry";
import { type Scope, Scopes } from "../scope";
import { createStore, type Store } from "../store";
import type { Token } from "../token";
import { ResolutionContext } from "./context";
import { InvalidDependencyError, MissingProviderError } from "./errors";
import type { Resolver } from "./types";

class ResolverClass implements Resolver {
	private readonly registry: Registry;
	private readonly store: Store = createStore();
	private readonly parent: ResolverClass | undefined;

	constructor(registry: Registry, parent?: ResolverClass) {
		this.registry = registry;
		this.parent = parent;
	}

	resolve<T>(token: Token<T>): T {
		return this.resolveToken(token, new ResolutionContext());
	}

	invalidate(token: Token<unknown>): void {
		this.store.delete(token);
	}

	dispose(): Promise<void> {
		return this.store.dispose();
	}

	private resolveToken<T>(token: Token<T>, context: ResolutionContext): T {
		const owner = this.findOwner(token);

		if (!owner) {
			throw new MissingProviderError(token.name);
		}

		const provider = owner.registry.get(token);

		if (!provider) {
			throw new MissingProviderError(token.name);
		}

		if (isValueProvider(provider)) {
			return provider.useValue as T;
		}

		if (isFactoryProvider(provider)) {
			// Where the instance lives depends on its scope: singletons are cached
			// on the owner (shared by the whole subtree), scoped instances on the
			// requesting container (one per child), transient ones nowhere.
			const host = this.selectHost(provider.scope, owner);

			if (host) {
				const cached = host.store.get(token);

				if (cached) {
					return cached.value as T;
				}
			}

			context.enter(token);

			try {
				// Dependencies resolve from the host so a scoped instance sees the
				// requesting container's providers, while a singleton sees its owner's.
				const deps = (host ?? this).resolveDeps(provider.deps, context);
				const value = provider.useFactory(deps) as T;

				if (host) {
					host.store.set(token, {
						value,
						...(provider.onDispose ? { onDispose: provider.onDispose } : {}),
					});
				}

				return value;
			} finally {
				context.exit(token);
			}
		}

		throw new MissingProviderError(token.name);
	}

	private findOwner(token: Token<unknown>): ResolverClass | undefined {
		let resolver: ResolverClass | undefined = this;

		while (resolver) {
			if (resolver.registry.has(token)) {
				return resolver;
			}

			resolver = resolver.parent;
		}

		return undefined;
	}

	private selectHost(
		scope: Scope | undefined,
		owner: ResolverClass,
	): ResolverClass | undefined {
		if (scope === Scopes.Transient) {
			return undefined;
		}

		if (scope === Scopes.Scoped) {
			return this;
		}

		return owner;
	}

	private resolveDeps<TDeps extends DepsMap>(
		deps: TDeps | undefined,
		context: ResolutionContext,
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

			resolvedDeps[key] = this.resolveToken(
				token,
				context,
			) as ResolveDeps<TDeps>[typeof key];
		}

		return resolvedDeps as ResolveDeps<TDeps>;
	}
}

export const createResolver = (
	registry: Registry,
	parent?: Resolver,
): Resolver => new ResolverClass(registry, parent as ResolverClass | undefined);

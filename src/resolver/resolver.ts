import type { DepsMap, Provider, ResolveDeps } from "../provider";
import {
	isFactoryProvider,
	isOptionalDependency,
	isValueProvider,
} from "../provider";
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
		return this.resolveToken(token, undefined);
	}

	resolveOptional<T>(token: Token<T>): T | undefined {
		return this.lookupOptional(token, undefined);
	}

	invalidate(token: Token<unknown>): void {
		this.store.delete(token);
	}

	// True if a locally-cached instance has an onDispose hook.
	hasDisposableInstance(token: Token<unknown>): boolean {
		return this.store.get(token)?.onDispose !== undefined;
	}

	dispose(): Promise<void> {
		return this.store.dispose();
	}

	// context is allocated lazily by the first building factory (zero-alloc cache hits).
	private resolveToken<T>(
		token: Token<T>,
		context: ResolutionContext | undefined,
	): T {
		// Single walk up the parent chain, fetching the provider directly.
		let owner: ResolverClass | undefined = this;
		let provider: Provider | undefined;

		while (owner) {
			provider = owner.registry.get(token);

			if (provider) {
				break;
			}

			owner = owner.parent;
		}

		if (!provider || !owner) {
			throw new MissingProviderError(token.name);
		}

		if (isValueProvider(provider)) {
			return provider.useValue as T;
		}

		if (isFactoryProvider(provider)) {
			// Scope decides the host: singleton on owner, scoped on this, transient nowhere.
			const host = this.selectHost(provider.scope, owner);

			if (host) {
				const cached = host.store.get(token);

				if (cached) {
					return cached.value as T;
				}
			}

			// Allocate cycle detection only now, threading it through the build.
			const ctx = context ?? new ResolutionContext();
			ctx.enter(token);

			try {
				// Resolve deps from the host: scoped sees this container, singleton sees owner.
				const deps = (host ?? this).resolveDeps(provider.deps, ctx);
				const value = provider.useFactory(deps) as T;

				if (host) {
					host.store.set(token, {
						value,
						...(provider.onDispose ? { onDispose: provider.onDispose } : {}),
					});
				}

				return value;
			} finally {
				ctx.exit(token);
			}
		}

		throw new MissingProviderError(token.name);
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
			const dependency = deps[key];

			if (dependency === undefined) {
				throw new InvalidDependencyError(String(key));
			}

			resolvedDeps[key] = (
				isOptionalDependency(dependency)
					? this.lookupOptional(dependency.token, context)
					: this.resolveToken(dependency, context)
			) as ResolveDeps<TDeps>[typeof key];
		}

		return resolvedDeps as ResolveDeps<TDeps>;
	}

	// Absent provider -> undefined; a present one resolves normally (its errors surface).
	private lookupOptional<T>(
		token: Token<T>,
		context: ResolutionContext | undefined,
	): T | undefined {
		let owner: ResolverClass | undefined = this;

		while (owner) {
			if (owner.registry.has(token)) {
				return this.resolveToken(token, context);
			}

			owner = owner.parent;
		}

		return undefined;
	}
}

export const createResolver = (
	registry: Registry,
	parent?: Resolver,
): Resolver => new ResolverClass(registry, parent as ResolverClass | undefined);

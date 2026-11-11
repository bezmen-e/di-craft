import {
	InvalidProviderError,
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

// Lifetime ordering: longer-lived scopes rank lower. A provider may only depend
// on dependencies that live at least as long as itself.
const lifetimeRank = (scope: Scope | undefined): number =>
	scope === Scopes.Scoped ? 1 : scope === Scopes.Transient ? 2 : 0;

class ResolverClass implements Resolver {
	private readonly registry: Registry;
	private readonly store: Store = createStore();
	private readonly parent: ResolverClass | undefined;
	// Reused across top-level resolutions; enter/exit keep its path balanced.
	// Allocated lazily so containers that never resolve pay nothing.
	private sharedContext: ResolutionContext | undefined;

	constructor(registry: Registry, parent?: Resolver) {
		this.registry = registry;
		this.parent = parent instanceof ResolverClass ? parent : undefined;
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

	// context is threaded through the build and allocated once per resolver.
	// consumerScope/consumerName describe the provider depending on this token, if any.
	private resolveToken<T>(
		token: Token<T>,
		context: ResolutionContext | undefined,
		consumerScope?: Scope,
		consumerName?: string,
	): T {
		// Single walk up the parent chain, fetching the provider directly.
		let owner: ResolverClass | undefined = this;
		let provider = this.registry.get(token);

		while (!provider && owner.parent) {
			owner = owner.parent;
			provider = owner.registry.get(token);
		}

		if (!provider) {
			throw new MissingProviderError(token.name);
		}

		// Values outlive every scope, so they are always a safe dependency.
		if (isValueProvider(provider)) {
			return provider.useValue as T;
		}

		// Otherwise it is a factory provider (the only remaining variant).
		// Reject capturing a shorter-lived dependency into a longer-lived consumer.
		const scope = provider.scope;

		if (
			consumerScope !== undefined &&
			lifetimeRank(scope) > lifetimeRank(consumerScope)
		) {
			throw new InvalidProviderError(
				`"${consumerName}" (${consumerScope}) cannot depend on "${token.name}" (${scope ?? Scopes.Singleton}): a longer-lived provider would capture a shorter-lived one. Widen the dependency's scope or narrow the consumer's.`,
			);
		}

		// Scope decides the host: singleton on owner, scoped on this, transient nowhere.
		const host =
			scope === Scopes.Scoped
				? this
				: scope === Scopes.Transient
					? undefined
					: owner;

		if (host) {
			const cached = host.store.get(token);

			if (cached) {
				return cached.value as T;
			}
		}

		// Dependencies resolve from the host: scoped sees this container,
		// singleton sees owner, transient sees the requesting container.
		const hostResolver = host ?? this;
		let ctx = context;

		if (ctx === undefined) {
			this.sharedContext ??= new ResolutionContext();
			ctx = this.sharedContext;
		}

		ctx.enter(token);

		try {
			// Iterate deps without allocating a key array; providers are literals,
			// so for-in only sees their own enumerable keys.
			const providerDeps = provider.deps;
			let deps: Record<string, unknown> | undefined;

			if (providerDeps) {
				deps = {};

				for (const key in providerDeps) {
					const dependency = providerDeps[key];

					if (dependency === undefined) {
						throw new InvalidDependencyError(key);
					}

					deps[key] = isOptionalDependency(dependency)
						? hostResolver.lookupOptional(
								dependency.token,
								ctx,
								scope,
								token.name,
							)
						: hostResolver.resolveToken(dependency, ctx, scope, token.name);
				}
			}

			const value = provider.useFactory(deps ?? {}) as T;

			if (host) {
				host.store.set(
					token,
					provider.onDispose
						? { value, onDispose: provider.onDispose }
						: { value },
				);
			}

			return value;
		} finally {
			ctx.exit();
		}
	}

	// Absent provider -> undefined; a present one resolves normally (its errors surface).
	private lookupOptional<T>(
		token: Token<T>,
		context: ResolutionContext | undefined,
		consumerScope?: Scope,
		consumerName?: string,
	): T | undefined {
		let owner: ResolverClass | undefined = this;

		while (owner) {
			if (owner.registry.has(token)) {
				return this.resolveToken(token, context, consumerScope, consumerName);
			}

			owner = owner.parent;
		}

		return undefined;
	}
}

export const createResolver = (
	registry: Registry,
	parent?: Resolver,
): Resolver => new ResolverClass(registry, parent);

import type { DepsMap, ResolveDeps } from "../provider";
import { isFactoryProvider, isValueProvider } from "../provider";
import type { Registry } from "../registry";
import { Scopes } from "../scope";
import { createStore, type Store } from "../store";
import type { Token } from "../token";
import {
	CircularDependencyError,
	InvalidDependencyError,
	MissingProviderError,
} from "./errors";
import type { ResolutionContext, Resolver } from "./types";

class ResolverClass implements Resolver {
	private readonly registry: Registry;
	private readonly store: Store = createStore();

	constructor(registry: Registry) {
		this.registry = registry;
	}

	resolve<T>(token: Token<T>): T {
		return this.resolveToken(token, {
			resolving: new Set(),
			path: [],
		});
	}

	invalidate(token: Token<unknown>): void {
		this.store.delete(token);
	}

	dispose(): Promise<void> {
		return this.store.dispose();
	}

	private resolveToken<T>(token: Token<T>, context: ResolutionContext): T {
		const provider = this.registry.get(token);

		if (!provider) {
			throw new MissingProviderError(token.name);
		}

		if (isValueProvider(provider)) {
			return provider.useValue as T;
		}

		if (isFactoryProvider(provider)) {
			// Singleton and scoped instances are cached; transient ones never are.
			const isCached = provider.scope !== Scopes.Transient;

			if (isCached) {
				const cached = this.store.get(token);

				if (cached) {
					return cached.value as T;
				}
			}

			if (context.resolving.has(token.id)) {
				const cycleStartIndex = context.path.findIndex(
					(pathToken) => pathToken.id === token.id,
				);

				const cycle = [...context.path.slice(cycleStartIndex), token];

				throw new CircularDependencyError(
					cycle.map((cycleToken) => cycleToken.name),
				);
			}

			context.resolving.add(token.id);
			context.path.push(token);

			try {
				const deps = this.resolveDeps(provider.deps, context);
				const value = provider.useFactory(deps) as T;

				if (isCached) {
					this.store.set(token, {
						value,
						...(provider.onDispose ? { onDispose: provider.onDispose } : {}),
					});
				}

				return value;
			} finally {
				context.path.pop();
				context.resolving.delete(token.id);
			}
		}

		throw new MissingProviderError(token.name);
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

export const createResolver = (registry: Registry): Resolver =>
	new ResolverClass(registry);

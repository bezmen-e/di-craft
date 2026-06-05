import type { DepsMap, ResolveDeps } from "../provider";
import { isFactoryProvider, isValueProvider } from "../provider";
import type { Registry } from "../registry";
import type { Token } from "../token";
import {
	CircularDependencyError,
	InvalidDependencyError,
	MissingProviderError,
} from "./errors";
import type { ResolutionContext, Resolver } from "./types";

class ResolverClass implements Resolver {
	private readonly registry: Registry;
	private readonly instances = new Map<symbol, unknown>();

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
		this.instances.delete(token.id);
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
			const scope = provider.scope ?? "singleton";

			if (scope === "singleton" && this.instances.has(token.id)) {
				return this.instances.get(token.id) as T;
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

				if (scope === "singleton") {
					this.instances.set(token.id, value);
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

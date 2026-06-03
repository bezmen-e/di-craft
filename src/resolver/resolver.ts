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
			stack: [],
		});
	}

	private resolveToken<T>(token: Token<T>, context: ResolutionContext): T {
		const cycleStartIndex = context.stack.findIndex(
			(stackToken) => stackToken.id === token.id,
		);

		if (cycleStartIndex !== -1) {
			const cycle = [...context.stack.slice(cycleStartIndex), token];

			throw new CircularDependencyError(
				cycle.map((cycleToken) => cycleToken.name),
			);
		}

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

			const nextContext: ResolutionContext = {
				stack: [...context.stack, token],
			};

			const deps = this.resolveDeps(provider.deps, nextContext);
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

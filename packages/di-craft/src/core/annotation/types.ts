import type { Dependency, DisposeHook, OptionalDependency } from "../provider";
import type { Scope } from "../scope";
import type { Token } from "../token";

type InjectableDeps = readonly Dependency<unknown>[];

type DependencyValue<TDependency> =
	TDependency extends OptionalDependency<infer T>
		? T | undefined
		: TDependency extends Token<infer T>
			? T
			: never;

export type ResolveDependencyTuple<TDeps extends InjectableDeps> = {
	-readonly [TKey in keyof TDeps]: DependencyValue<TDeps[TKey]>;
};

/**
 * Constructor type whose parameters match an injectable dependency tuple.
 */
export type InjectableConstructor<T, TDeps extends InjectableDeps> = new (
	...args: ResolveDependencyTuple<TDeps>
) => T;

/**
 * Class that can be passed to `provideInjectable`.
 *
 * `never[]` keeps classes with required constructor parameters assignable
 * without claiming arbitrary constructor arguments are valid.
 */
export type InjectableClass<T = unknown> = new (...args: never[]) => T;

/**
 * Options stored by `@Injectable` and converted into a factory provider.
 */
export type InjectableOptions<
	T,
	TDeps extends InjectableDeps = InjectableDeps,
> = {
	/**
	 * Token provided by the decorated class.
	 */
	readonly token: Token<T>;
	/**
	 * Ordered constructor dependencies.
	 *
	 * Each item is resolved and passed to the constructor at the same index.
	 */
	readonly deps?: TDeps;
	/**
	 * Provider lifetime.
	 *
	 * Defaults to `Scopes.Singleton`.
	 */
	readonly scope?: Scope;
	/**
	 * Cleanup hook for cached singleton and scoped instances.
	 *
	 * Not supported for transient providers.
	 */
	readonly onDispose?: DisposeHook<T>;
};

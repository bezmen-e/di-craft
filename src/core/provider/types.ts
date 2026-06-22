import type { Scope } from "../scope";
import type { Token } from "../token";

/**
 * A token wrapped as an optional dependency.
 *
 * Optional dependencies resolve to `undefined` when no provider is registered
 * in the container chain.
 */
export type OptionalDependency<T> = {
	readonly token: Token<T>;
	readonly optional: true;
};

/**
 * A dependency accepted by factory providers and `container.get`.
 */
export type Dependency<T> = Token<T> | OptionalDependency<T>;

export type DepsMap = Record<string, Dependency<unknown>>;

type DependencyValue<TDep> =
	TDep extends OptionalDependency<infer T>
		? T | undefined
		: TDep extends Token<infer T>
			? T
			: never;

export type ResolveDeps<TDeps extends DepsMap> = {
	readonly [TKey in keyof TDeps]: DependencyValue<TDeps[TKey]>;
};

export type Factory<T, TDeps extends DepsMap> = (deps: ResolveDeps<TDeps>) => T;

/**
 * Cleanup hook called for a cached instance during container disposal.
 *
 * Transient providers cannot use disposal hooks because their instances are not
 * cached or tracked by the container.
 */
export type DisposeHook<T> = (instance: T) => void | Promise<void>;

/**
 * Provider that resolves a token to an existing value.
 */
export type ValueProvider<T> = {
	readonly provide: Token<T>;
	readonly useValue: T;
};

/**
 * Provider that lazily creates a token value from typed dependencies.
 *
 * `deps` keys become the properties passed to `useFactory`, `scope` controls
 * caching lifetime, and `onDispose` runs for cached singleton/scoped instances.
 */
export type FactoryProvider<T, TDeps extends DepsMap = Record<never, never>> = {
	readonly provide: Token<T>;
	readonly deps?: TDeps;
	readonly scope?: Scope;
	readonly useFactory: Factory<T, TDeps>;
	readonly onDispose?: DisposeHook<T>;
};

// biome-ignore lint/suspicious/noExplicitAny: the value type appears in contravariant position (onDispose) and deps are invariant, so any is required to keep specific FactoryProvider types assignable to the Provider union
export type AnyFactoryProvider = FactoryProvider<any, any>;

/**
 * Provider accepted by `createContainer` and `container.register`.
 */
export type Provider = ValueProvider<unknown> | AnyFactoryProvider;

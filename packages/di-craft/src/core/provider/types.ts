import type { Scope } from "../scope";
import type { Token } from "../token";

/**
 * A token wrapped as an optional dependency.
 *
 * Optional dependencies resolve to `undefined` when no provider is registered
 * in the container chain.
 */
export type OptionalDependency<T> = {
	/** Wrapped token whose provider may be absent. */
	readonly token: Token<T>;
	/** Marker used by the resolver to distinguish optional dependencies. */
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
	/** Token registered by this provider. */
	readonly provide: Token<T>;
	/** Existing value returned for the token. */
	readonly useValue: T;
};

/**
 * Provider that lazily creates a token value from typed dependencies.
 *
 * `deps` keys become the properties passed to `useFactory`, `scope` controls
 * caching lifetime, and `onDispose` runs for cached singleton/scoped instances.
 */
export type FactoryProvider<T, TDeps extends DepsMap = Record<never, never>> = {
	/** Token registered by this provider. */
	readonly provide: Token<T>;
	/** Named dependencies resolved before the factory is called. */
	readonly deps?: TDeps;
	/** Caching lifetime for the created value. */
	readonly scope?: Scope;
	/** Function that creates the token value. */
	readonly useFactory: Factory<T, TDeps>;
	/** Cleanup hook for cached values. */
	readonly onDispose?: DisposeHook<T>;
};

// biome-ignore lint/suspicious/noExplicitAny: the value type appears in contravariant position (onDispose) and deps are invariant, so any is required to keep specific FactoryProvider types assignable to the Provider union
export type AnyFactoryProvider = FactoryProvider<any, any>;

/**
 * Provider accepted by `createContainer` and `container.register`.
 */
export type Provider = ValueProvider<unknown> | AnyFactoryProvider;

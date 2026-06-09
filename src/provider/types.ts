import type { Scope } from "../scope";
import type { Token } from "../token";

export type OptionalDependency<T> = {
	readonly token: Token<T>;
	readonly optional: true;
};

export type Dependency<T> = Token<T> | OptionalDependency<T>;

export type DepsMap = Record<string, Dependency<unknown>>;

export type TokenValue<TToken> =
	TToken extends Token<infer TValue> ? TValue : never;

export type DependencyValue<TDep> =
	TDep extends OptionalDependency<infer T>
		? T | undefined
		: TDep extends Token<infer T>
			? T
			: never;

export type ResolveDeps<TDeps extends DepsMap> = {
	readonly [TKey in keyof TDeps]: DependencyValue<TDeps[TKey]>;
};

export type Factory<T, TDeps extends DepsMap> = (deps: ResolveDeps<TDeps>) => T;

export type DisposeHook<T> = (instance: T) => void | Promise<void>;

export type ValueProvider<T> = {
	readonly provide: Token<T>;
	readonly useValue: T;
};

export type FactoryProvider<T, TDeps extends DepsMap = Record<never, never>> = {
	readonly provide: Token<T>;
	readonly deps?: TDeps;
	readonly scope?: Scope;
	readonly useFactory: Factory<T, TDeps>;
	readonly onDispose?: DisposeHook<T>;
};

// biome-ignore lint/suspicious/noExplicitAny: the value type appears in contravariant position (onDispose) and deps are invariant, so any is required to keep specific FactoryProvider types assignable to the Provider union
export type AnyFactoryProvider = FactoryProvider<any, any>;

export type Provider = ValueProvider<unknown> | AnyFactoryProvider;

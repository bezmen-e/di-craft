import type { Token } from "../token";

export type DepsMap = Record<string, Token<unknown>>;

export type TokenValue<TToken> =
	TToken extends Token<infer TValue> ? TValue : never;

export type ResolveDeps<TDeps extends DepsMap> = {
	readonly [TKey in keyof TDeps]: TokenValue<TDeps[TKey]>;
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

export type Scope = "singleton" | "transient";

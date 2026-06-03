import type { Token } from "../token";

export type DepsMap = Record<string, Token<unknown>>;

export type TokenValue<TToken> =
	TToken extends Token<infer TValue> ? TValue : never;

export type ResolveDeps<TDeps extends DepsMap> = {
	readonly [TKey in keyof TDeps]: TokenValue<TDeps[TKey]>;
};

export type Factory<T, TDeps extends DepsMap> = (deps: ResolveDeps<TDeps>) => T;

export type ValueProvider<T> = {
	readonly provide: Token<T>;
	readonly useValue: T;
};

export type FactoryProvider<T, TDeps extends DepsMap = Record<never, never>> = {
	readonly provide: Token<T>;
	readonly deps?: TDeps;
	readonly scope?: Scope;
	readonly useFactory: Factory<T, TDeps>;
};

export type AnyFactoryProvider = FactoryProvider<unknown, any>;

export type AnyProvider = ValueProvider<unknown> | AnyFactoryProvider;

export type Provider = AnyProvider;

export type Scope = "singleton" | "transient";

import type { Token } from "../token";

export type ValueProvider<T> = {
	readonly provide: Token<T>;
	readonly useValue: T;
};

export type FactoryProvider<T> = {
	readonly provide: Token<T>;
	readonly useFactory: () => T;
};

export type Provider<T = unknown> = ValueProvider<T> | FactoryProvider<T>;

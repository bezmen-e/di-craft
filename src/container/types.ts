import type { Provider } from "../provider";
import type { RegisterOptions } from "../registry";
import type { Token } from "../token";

export type Container = {
	register(provider: Provider, options?: RegisterOptions): void;
	get<T>(token: Token<T>): T;
	has(token: Token<unknown>): boolean;
};

import type { Provider } from "../provider";
import type { Token } from "../token";

export type Container = {
	register(provider: Provider): void;
	get<T>(token: Token<T>): T;
	has(token: Token<unknown>): boolean;
};

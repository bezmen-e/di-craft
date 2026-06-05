import type { Provider } from "../provider";
import type { Token } from "../token";

export type RegisterOptions = {
	readonly allowOverride?: boolean;
};

export type Registry = {
	register(provider: Provider, options?: RegisterOptions): void;
	get(token: Token<unknown>): Provider | undefined;
	has(token: Token<unknown>): boolean;
};

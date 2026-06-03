import type { Provider } from "../provider";
import type { Token } from "../token";

export type Registry = {
	register(provider: Provider): void;
	get(token: Token<unknown>): Provider | undefined;
	has(token: Token<unknown>): boolean;
};

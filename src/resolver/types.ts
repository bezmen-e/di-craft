import type { Token } from "../token";

export type Resolver = {
	resolve<T>(token: Token<T>): T;
	invalidate(token: Token<unknown>): void;
	dispose(): Promise<void>;
};

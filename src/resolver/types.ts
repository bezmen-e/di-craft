import type { Token } from "../token";

export type Resolver = {
	resolve<T>(token: Token<T>): T;
	resolveOptional<T>(token: Token<T>): T | undefined;
	invalidate(token: Token<unknown>): void;
	hasDisposableInstance(token: Token<unknown>): boolean;
	dispose(): Promise<void>;
};

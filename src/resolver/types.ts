import type { Token } from "../token";

export type Resolver = {
	resolve<T>(token: Token<T>): T;
};

export type ResolutionContext = {
	readonly resolving: Set<symbol>;
	readonly path: Token<unknown>[];
};

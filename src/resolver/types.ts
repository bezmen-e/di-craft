import type { Token } from "../token";

export type Resolver = {
	resolve<T>(token: Token<T>): T;
};

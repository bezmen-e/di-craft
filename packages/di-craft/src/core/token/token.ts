import type { Token } from "./types";

class TokenClass<T> implements Token<T> {
	readonly name: string;
	readonly id: symbol;

	declare readonly __type?: T;

	constructor(name: string) {
		this.name = name;
		this.id = Symbol(name);
	}
}

/**
 * Creates a unique typed token.
 *
 * The `name` is used only for diagnostics. Token identity is unique per call,
 * so two tokens with the same name do not collide.
 *
 * @example
 * ```ts
 * const CONFIG = createToken<Config>("config");
 * ```
 */
export const createToken = <T>(name: string): Token<T> =>
	new TokenClass<T>(name);

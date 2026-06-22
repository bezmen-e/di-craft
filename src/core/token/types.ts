/** A unique, typed key used to register and resolve a dependency. */
export type Token<T> = {
	/**
	 * Runtime identity of the token.
	 *
	 * Tokens with the same name still have different identities.
	 */
	readonly id: symbol;
	/**
	 * Human-readable name used in error messages and diagnostics.
	 */
	readonly name: string;

	readonly __type?: T;
};

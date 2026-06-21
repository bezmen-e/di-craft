import { DiError } from "../error";

/**
 * Error thrown when registering a provider for an already registered token.
 */
export class DuplicateProviderError extends DiError {
	constructor(tokenName: string) {
		super(`Provider for token "${tokenName}" is already registered`);

		this.name = "DuplicateProviderError";
	}
}

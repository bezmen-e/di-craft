import { DiError } from "../error";

/**
 * Error thrown when a provider configuration cannot be used safely.
 */
export class InvalidProviderError extends DiError {
	constructor(message: string) {
		super(message);

		this.name = "InvalidProviderError";
	}
}

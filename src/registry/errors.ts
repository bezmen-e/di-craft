import { DiError } from "../error";

export class DuplicateProviderError extends DiError {
	constructor(tokenName: string) {
		super(`Provider for token "${tokenName}" is already registered`);

		this.name = "DuplicateProviderError";
	}
}

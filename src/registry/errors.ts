export class DuplicateProviderError extends Error {
	constructor(tokenName: string) {
		super(`Provider for token "${tokenName}" is already registered`);

		this.name = "DuplicateProviderError";
	}
}

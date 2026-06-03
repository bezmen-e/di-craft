export class MissingProviderError extends Error {
	constructor(tokenName: string) {
		super(`Provider for token "${tokenName}" is not registered`);

		this.name = "MissingProviderError";
	}
}

export class InvalidDependencyError extends Error {
	constructor(dependencyKey: string) {
		super(`Invalid dependency "${dependencyKey}"`);

		this.name = "InvalidDependencyError";
	}
}

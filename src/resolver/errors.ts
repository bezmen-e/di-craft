import { DiError } from "../error";

export class MissingProviderError extends DiError {
	constructor(tokenName: string) {
		super(`Provider for token "${tokenName}" is not registered`);

		this.name = "MissingProviderError";
	}
}

export class InvalidDependencyError extends DiError {
	constructor(dependencyKey: string) {
		super(`Invalid dependency "${dependencyKey}"`);

		this.name = "InvalidDependencyError";
	}
}

export class CircularDependencyError extends DiError {
	constructor(tokenNames: string[]) {
		super(`Circular dependency detected: ${tokenNames.join(" -> ")}`);

		this.name = "CircularDependencyError";
	}
}

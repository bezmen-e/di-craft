import { DiError } from "../error";

/**
 * Error thrown when resolving a token without a registered provider.
 */
export class MissingProviderError extends DiError {
	constructor(tokenName: string) {
		super(`Provider for token "${tokenName}" is not registered`);

		this.name = "MissingProviderError";
	}
}

/**
 * Error thrown when a dependency descriptor is invalid.
 */
export class InvalidDependencyError extends DiError {
	constructor(dependencyKey: string) {
		super(`Invalid dependency "${dependencyKey}"`);

		this.name = "InvalidDependencyError";
	}
}

/**
 * Error thrown when provider dependencies form a cycle.
 */
export class CircularDependencyError extends DiError {
	constructor(tokenNames: string[]) {
		super(`Circular dependency detected: ${tokenNames.join(" -> ")}`);

		this.name = "CircularDependencyError";
	}
}

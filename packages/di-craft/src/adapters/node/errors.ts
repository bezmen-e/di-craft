import { DiError } from "../../core/error";

/**
 * Error thrown when reading a Node async request container outside its scope.
 */
export class NodeRequestScopeError extends DiError {
	constructor() {
		super(
			"di-craft/node getRequestContainer() was called outside runWithRequestContainer().",
		);

		this.name = "NodeRequestScopeError";
	}
}

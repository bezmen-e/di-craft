/**
 * Base class for all di-craft runtime errors.
 */
export class DiError extends Error {
	constructor(message: string) {
		super(message);

		this.name = "DiError";

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}

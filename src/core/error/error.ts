/**
 * Base class for all di-craft runtime errors.
 */
type ErrorConstructorWithStackTrace = ErrorConstructor & {
	readonly captureStackTrace?: (
		error: Error,
		constructorFunction: (...args: never[]) => unknown,
	) => void;
};

export class DiError extends Error {
	constructor(message: string) {
		super(message);

		this.name = "DiError";

		const errorConstructor = Error as ErrorConstructorWithStackTrace;
		const classConstructor = this.constructor as (...args: never[]) => unknown;

		if (errorConstructor.captureStackTrace) {
			errorConstructor.captureStackTrace(this, classConstructor);
		}
	}
}

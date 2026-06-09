import { DiError } from "../error";

export class InvalidProviderError extends DiError {
	constructor(message: string) {
		super(message);

		this.name = "InvalidProviderError";
	}
}

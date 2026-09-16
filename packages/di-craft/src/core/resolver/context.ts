import type { Token } from "../token";
import { CircularDependencyError } from "./errors";

export class ResolutionContext {
	private readonly path: Token<unknown>[] = [];
	private readonly pathIds: symbol[] = [];

	enter(token: Token<unknown>): void {
		const cycleStartIndex = this.pathIds.indexOf(token.id);
		if (cycleStartIndex !== -1) {
			const cycle = [...this.path.slice(cycleStartIndex), token];

			throw new CircularDependencyError(
				cycle.map((cycleToken) => cycleToken.name),
			);
		}

		this.path.push(token);
		this.pathIds.push(token.id);
	}

	exit(): void {
		this.path.pop();
		this.pathIds.pop();
	}
}

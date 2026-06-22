import type { Token } from "../token";
import { CircularDependencyError } from "./errors";

export class ResolutionContext {
	private readonly resolving = new Set<symbol>();
	private readonly path: Token<unknown>[] = [];

	enter(token: Token<unknown>): void {
		if (this.resolving.has(token.id)) {
			const cycleStartIndex = this.path.findIndex(
				(pathToken) => pathToken.id === token.id,
			);

			const cycle = [...this.path.slice(cycleStartIndex), token];

			throw new CircularDependencyError(
				cycle.map((cycleToken) => cycleToken.name),
			);
		}

		this.resolving.add(token.id);
		this.path.push(token);
	}

	exit(token: Token<unknown>): void {
		this.path.pop();
		this.resolving.delete(token.id);
	}
}

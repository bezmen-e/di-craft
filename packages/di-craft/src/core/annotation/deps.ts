import type { Dependency, DepsMap } from "../provider";

export const tupleDepsToMap = (
	deps: readonly Dependency<unknown>[],
): DepsMap | undefined => {
	if (deps.length === 0) {
		return undefined;
	}

	return Object.fromEntries(deps.entries());
};

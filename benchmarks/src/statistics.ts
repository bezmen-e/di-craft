import { itemAt } from "./invariant.ts";

export function median(values: readonly number[]): number {
	if (values.length === 0)
		throw new Error("Cannot calculate a median without values");
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? (itemAt(sorted, middle - 1) + itemAt(sorted, middle)) / 2
		: itemAt(sorted, middle);
}

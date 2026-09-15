import { describe, expect, test } from "bun:test";
import {
	balancedBlockSize,
	orderSubjects,
	subjects,
} from "../containers/subjects.ts";
import { itemAt, required } from "../invariant.ts";

describe("balanced subject order", () => {
	test("uses a doubled block for an odd number of subjects", () => {
		expect(subjects).toHaveLength(7);
		expect(balancedBlockSize()).toBe(14);
	});

	test("balances positions and ordered predecessors across one block", () => {
		const rounds = Array.from({ length: balancedBlockSize() }, (_, index) =>
			orderSubjects(index + 1).map((subject) => subject.name),
		);
		const positions = new Map(
			subjects.map((subject) => [subject.name, new Map<number, number>()]),
		);
		const adjacentPairs = new Map<string, number>();
		const relativeOrder = new Map<string, number>();

		for (const order of rounds) {
			expect(new Set(order).size).toBe(subjects.length);
			for (let position = 0; position < order.length; position += 1) {
				const name = itemAt(order, position);
				const counts = required(
					positions.get(name),
					`Missing position counts for ${name}`,
				);
				counts.set(position, (counts.get(position) ?? 0) + 1);
				if (position > 0) {
					const pair = `${order[position - 1]}\0${name}`;
					adjacentPairs.set(pair, (adjacentPairs.get(pair) ?? 0) + 1);
				}
			}

			for (let left = 0; left < order.length; left += 1) {
				for (let right = left + 1; right < order.length; right += 1) {
					const pair = `${order[left]}\0${order[right]}`;
					relativeOrder.set(pair, (relativeOrder.get(pair) ?? 0) + 1);
				}
			}
		}

		for (const subjectPositions of positions.values()) {
			expect(subjectPositions.size).toBe(subjects.length);
			for (const count of subjectPositions.values()) expect(count).toBe(2);
		}

		expect(adjacentPairs.size).toBe(subjects.length * (subjects.length - 1));
		for (const count of adjacentPairs.values()) expect(count).toBe(2);

		for (const left of subjects) {
			for (const right of subjects) {
				if (left === right) continue;
				expect(relativeOrder.get(`${left.name}\0${right.name}`)).toBe(
					subjects.length,
				);
			}
		}
	});
});

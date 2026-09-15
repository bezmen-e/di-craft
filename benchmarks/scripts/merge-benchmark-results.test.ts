import { describe, expect, test } from "bun:test";
import { itemAt } from "../src/invariant.ts";
import type { SubjectProcessResult } from "../src/runner/result-types.ts";
import { mergeSubjectResults } from "./merge-benchmark-results.ts";

const subjectOrder = ["A", "B"];
const resultOrder = ["B", "A"];

function partial(
	subjectPosition: number,
	values: { hot: number; registration: number | null },
): SubjectProcessResult {
	const subject = itemAt(subjectOrder, subjectPosition);
	const result = (value: number | null) =>
		value === null
			? { subject, supported: false, normalizedNsPerOp: null, raw: null }
			: {
					subject,
					supported: true,
					normalizedNsPerOp: value,
					raw: {
						totalTimeMs: 1,
						minBatchMs: 1,
						maxBatchMs: 1,
						meanBatchMs: 1,
						medianBatchMs: 1,
						hz: 1,
						rme: 0,
						sampleCount: 1,
					},
				};

	return {
		round: 2,
		subjectPosition,
		subject,
		resultOrder,
		subjectOrder,
		timing: { timeMs: 100, warmupTimeMs: 50 },
		scenarios: [
			{
				id: "hot-singleton",
				name: "Hot singleton resolve",
				batchSize: 1000,
				result: result(values.hot),
			},
			{
				id: "registration",
				name: "Registration",
				batchSize: 10,
				result: result(values.registration),
			},
		],
	};
}

describe("subject-isolated benchmark merge", () => {
	test("restores canonical result order and preserves measured order", () => {
		const merged = mergeSubjectResults([
			partial(0, { hot: 6, registration: 2000 }),
			partial(1, { hot: 6.1, registration: null }),
		]);

		expect(merged.subjectOrder).toEqual(subjectOrder);
		expect(
			merged.scenarios[0]?.results.map((result) => result.subject),
		).toEqual(resultOrder);
		expect(merged.scenarios[1]?.results[0]).toMatchObject({
			subject: "B",
			supported: false,
		});
	});

	test("rejects missing subject processes", () => {
		expect(() =>
			mergeSubjectResults([partial(0, { hot: 6, registration: 2000 })]),
		).toThrow("expected 2 subject results, received 1");
	});
});

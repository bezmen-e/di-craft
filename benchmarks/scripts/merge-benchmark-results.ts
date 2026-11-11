import { itemAt, required } from "../src/invariant.ts";
import type {
	BenchmarkRoundResult,
	SubjectProcessResult,
} from "../src/runner/result-types.ts";

export function mergeSubjectResults(
	partials: readonly SubjectProcessResult[],
): BenchmarkRoundResult {
	if (partials.length === 0)
		throw new Error("Cannot merge an empty benchmark round");

	const first = itemAt(partials, 0);
	const subjectOrder = [...first.subjectOrder];
	const resultOrder = [...first.resultOrder];
	if (subjectOrder.length === 0)
		throw new Error("Benchmark round has no subject order");
	if (resultOrder.length !== subjectOrder.length) {
		throw new Error("Benchmark round has an invalid result order");
	}
	if (partials.length !== subjectOrder.length) {
		throw new Error(
			`Benchmark round expected ${subjectOrder.length} subject results, received ${partials.length}`,
		);
	}

	const bySubject = new Map<string, SubjectProcessResult>();
	const timing = JSON.stringify(first.timing);
	for (let position = 0; position < partials.length; position += 1) {
		const partial = itemAt(partials, position);
		const expectedSubject = itemAt(subjectOrder, position);
		if (partial.round !== first.round)
			throw new Error("Benchmark subject round mismatch");
		if (partial.subjectPosition !== position) {
			throw new Error(`Benchmark subject position mismatch at ${position}`);
		}
		if (partial.subject !== expectedSubject) {
			throw new Error(
				`Benchmark subject mismatch at ${position}: expected ${expectedSubject}, received ${partial.subject}`,
			);
		}
		if (
			JSON.stringify(partial.subjectOrder) !== JSON.stringify(subjectOrder) ||
			JSON.stringify(partial.resultOrder) !== JSON.stringify(resultOrder)
		) {
			throw new Error(
				`Benchmark subject order mismatch for ${partial.subject}`,
			);
		}
		if (JSON.stringify(partial.timing) !== timing) {
			throw new Error(`Benchmark timing mismatch for ${partial.subject}`);
		}
		if (partial.scenarios.length !== first.scenarios.length) {
			throw new Error(
				`Benchmark scenario count mismatch for ${partial.subject}`,
			);
		}
		if (bySubject.has(partial.subject)) {
			throw new Error(`Duplicate benchmark subject result: ${partial.subject}`);
		}
		bySubject.set(partial.subject, partial);
	}

	if (
		new Set(subjectOrder).size !== subjectOrder.length ||
		new Set(resultOrder).size !== resultOrder.length ||
		resultOrder.some((subject) => !bySubject.has(subject))
	) {
		throw new Error(
			"Benchmark subject orders must contain the same unique subjects",
		);
	}

	return {
		round: first.round,
		subjectOrder,
		timing: first.timing,
		scenarios: first.scenarios.map((scenario, scenarioIndex) => ({
			id: scenario.id,
			name: scenario.name,
			batchSize: scenario.batchSize,
			results: resultOrder.map((subject) => {
				const subjectResult = required(
					bySubject.get(subject),
					`Missing benchmark subject result: ${subject}`,
				);
				const candidate = itemAt(
					subjectResult.scenarios,
					scenarioIndex,
					`Missing benchmark scenario for ${subject}/${scenario.id}`,
				);
				if (
					candidate.id !== scenario.id ||
					candidate.name !== scenario.name ||
					candidate.batchSize !== scenario.batchSize
				) {
					throw new Error(
						`Benchmark scenario mismatch for ${subject}/${scenario.id}`,
					);
				}
				if (candidate.result.subject !== subject) {
					throw new Error(
						`Benchmark result subject mismatch for ${subject}/${scenario.id}`,
					);
				}
				return candidate.result;
			}),
		})),
	};
}

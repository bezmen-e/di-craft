import { describe, expect, test } from "bun:test";
import type { BenchmarkRun } from "../src/results.ts";
import type { BenchmarkRoundResult } from "../src/runner/result-types.ts";
import {
	hasBalancedSubjectOrder,
	isPublishableResult,
	mad,
	median,
	renderReport,
} from "./report-benchmarks.ts";

function round(
	roundNumber: number,
	subjectOrder: readonly string[],
): BenchmarkRoundResult {
	return {
		round: roundNumber,
		subjectOrder,
		timing: { timeMs: 100, warmupTimeMs: 50 },
		scenarios: [
			{
				id: "hot-singleton",
				name: "Hot singleton resolve",
				batchSize: 1000,
				results: [
					{
						subject: "di-craft",
						supported: true,
						normalizedNsPerOp: 10 + roundNumber,
						raw: null,
					},
					{
						subject: "Other",
						supported: true,
						normalizedNsPerOp: 20 + roundNumber,
						raw: null,
					},
				],
			},
		],
	};
}

function publicRun(): BenchmarkRun {
	return {
		schemaVersion: 1,
		generatedAt: "2026-09-15T00:00:00.000Z",
		mode: "public",
		artifact: {
			mode: "production",
			entry: "../packages/di-craft/dist/index.mjs",
		},
		git: { commit: "abc123", dirty: false },
		environment: {
			bun: "1.4.2",
			os: "test",
			architecture: "arm64",
			cpu: "test cpu",
			powerMode: null,
		},
		dependencies: {},
		configuration: {
			rounds: 2,
			balancedBlockSize: 2,
			timeMs: 100,
			warmupTimeMs: 50,
			frozenLockfile: true,
			processIsolation: true,
			processIsolationLevel: "subject",
			subjectOrder: "balanced-latin-square",
		},
		rounds: [round(1, ["di-craft", "Other"]), round(2, ["Other", "di-craft"])],
	};
}

describe("benchmark reports", () => {
	test("calculates median and MAD", () => {
		expect(median([3, 1, 2])).toBe(2);
		expect(median([4, 1, 2, 3])).toBe(2.5);
		expect(mad([1, 2, 3])).toBe(1);
	});

	test("accepts a complete balanced public result", () => {
		const raw = publicRun();
		expect(hasBalancedSubjectOrder(raw.rounds)).toBe(true);
		expect(isPublishableResult(raw)).toBe(true);
	});

	test("renders deterministic markdown", () => {
		const raw = publicRun();
		const first = renderReport(raw, "results/public.json");
		expect(renderReport(raw, "results/public.json")).toBe(first);
		expect(first).toContain("| di-craft | 11.500 | 0.500 | 1.00× | 1 |");
	});
});

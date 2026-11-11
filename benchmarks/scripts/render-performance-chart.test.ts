import { describe, expect, test } from "bun:test";

import type { BenchmarkRun } from "../src/results.ts";
import type { BenchmarkRoundResult } from "../src/runner/result-types.ts";
import { renderPerformanceChart } from "./render-performance-chart.ts";

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
						supported: false,
						normalizedNsPerOp: null,
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
		generatedAt: "2026-11-11T00:00:00.000Z",
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

describe("performance chart", () => {
	test("renders a deterministic interactive svg", () => {
		const svg = renderPerformanceChart(publicRun(), "results/public.json");
		expect(renderPerformanceChart(publicRun(), "results/public.json")).toBe(
			svg,
		);
		expect(svg).toContain('role="tablist"');
		expect(svg).toContain('id="tab-0"');
		expect(svg).toContain('id="row-0"');
		expect(svg).toContain('id="row-1"');
		expect(svg).toContain("<![CDATA[");
	});

	test("renders medians and marks unsupported subjects as N/A", () => {
		const svg = renderPerformanceChart(publicRun(), "results/public.json");
		expect(svg).toContain("di-craft: 11.500 ns/op");
		expect(svg).toContain("Other: N/A");
		expect(svg).toContain('const data=[{"name":"Hot singleton resolve"');
	});

	test("rejects results that are not publishable", () => {
		const raw = publicRun();
		const quick = { ...raw, mode: "quick" } as BenchmarkRun;
		expect(() => renderPerformanceChart(quick, "results/quick.json")).toThrow(
			"Only a frozen-lockfile production result",
		);
	});
});

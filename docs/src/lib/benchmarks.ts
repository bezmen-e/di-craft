import rawBenchmarkData from "../data/benchmarks.json";

export interface BenchmarkResult {
	readonly subject: string;
	readonly medianNs: number | null;
	readonly madNs: number | null;
	readonly relative: number | null;
	readonly rank: number | null;
	readonly medianText: string;
	readonly madText: string;
	readonly relativeText: string;
	readonly combinedText: string;
}

export interface BenchmarkScenario {
	readonly id: string;
	readonly name: string;
	readonly results: readonly BenchmarkResult[];
}

interface BenchmarkData {
	readonly schemaVersion: 1;
	readonly published: boolean;
	readonly sourceResult: string | null;
	readonly generatedAt: string | null;
	readonly git: {
		readonly commit: string;
		readonly dirty: boolean;
	} | null;
	readonly environment: {
		readonly bun: string;
		readonly os: string;
		readonly architecture: string;
		readonly cpu: string;
		readonly powerMode: string | null;
	} | null;
	readonly configuration: {
		readonly rounds: number;
		readonly balancedBlockSize: number;
		readonly timeMs: number;
		readonly warmupTimeMs: number;
		readonly frozenLockfile: boolean;
		readonly processIsolation: true;
		readonly processIsolationLevel: "subject";
		readonly subjectOrder: "balanced-latin-square";
	} | null;
	readonly subjects: readonly string[];
	readonly scenarios: readonly BenchmarkScenario[];
}

export const benchmarkData = rawBenchmarkData as BenchmarkData;

export function benchmarkDate(isoDate: string): string {
	return new Intl.DateTimeFormat("en", {
		dateStyle: "medium",
		timeZone: "UTC",
	}).format(new Date(isoDate));
}

export function resultFor(
	scenario: BenchmarkScenario,
	subject: string,
): BenchmarkResult | undefined {
	return scenario.results.find((result) => result.subject === subject);
}

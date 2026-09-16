import type { BenchmarkRoundResult } from "./runner/result-types.ts";

export interface BenchmarkRun {
	readonly schemaVersion: 1;
	readonly generatedAt: string;
	readonly mode: "quick" | "public";
	readonly artifact: {
		readonly mode: "production";
		readonly entry: string;
	};
	readonly git: {
		readonly commit: string;
		readonly dirty: boolean;
	};
	readonly environment: {
		readonly bun: string;
		readonly os: string;
		readonly architecture: string;
		readonly cpu: string;
		readonly powerMode: string | null;
	};
	readonly dependencies: Readonly<Record<string, string>>;
	readonly configuration: {
		readonly rounds: number;
		readonly balancedBlockSize: number;
		readonly timeMs: number;
		readonly warmupTimeMs: number;
		readonly frozenLockfile: boolean;
		readonly processIsolation: true;
		readonly processIsolationLevel: "subject";
		readonly subjectOrder: "balanced-latin-square";
	};
	readonly rounds: readonly BenchmarkRoundResult[];
}

export interface AggregatedSubjectResult {
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

export interface AggregatedScenario {
	readonly id: string;
	readonly name: string;
	readonly results: readonly AggregatedSubjectResult[];
}

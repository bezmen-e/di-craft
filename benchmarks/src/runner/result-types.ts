export interface RawTaskResult {
	readonly totalTimeMs: number;
	readonly minBatchMs: number;
	readonly maxBatchMs: number;
	readonly meanBatchMs: number;
	readonly medianBatchMs: number;
	readonly hz: number;
	readonly rme: number;
	readonly sampleCount: number;
}

export interface SubjectRoundResult {
	readonly subject: string;
	readonly supported: boolean;
	readonly normalizedNsPerOp: number | null;
	readonly raw: RawTaskResult | null;
}

export interface SubjectScenarioResult {
	readonly id: string;
	readonly name: string;
	readonly batchSize: number;
	readonly result: SubjectRoundResult;
}

export interface SubjectProcessResult {
	readonly round: number;
	readonly subjectPosition: number;
	readonly subject: string;
	readonly subjectOrder: readonly string[];
	readonly resultOrder: readonly string[];
	readonly timing: {
		readonly timeMs: number;
		readonly warmupTimeMs: number;
	};
	readonly scenarios: readonly SubjectScenarioResult[];
}

export interface ScenarioRoundResult {
	readonly id: string;
	readonly name: string;
	readonly batchSize: number;
	readonly results: readonly SubjectRoundResult[];
}

export interface BenchmarkRoundResult {
	readonly round: number;
	readonly subjectOrder: readonly string[];
	readonly timing: {
		readonly timeMs: number;
		readonly warmupTimeMs: number;
	};
	readonly scenarios: readonly ScenarioRoundResult[];
}

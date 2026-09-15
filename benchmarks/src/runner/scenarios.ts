import { setImmediate as nextEventLoopTurn } from "node:timers/promises";
import { Bench, type TaskResult } from "tinybench";
import type {
	ColdGraph,
	MaybePromise,
	Resolver,
	ScopeHandle,
	Subject,
} from "../containers/types.ts";
import { required } from "../invariant.ts";
import { median } from "../statistics.ts";
import type { RawTaskResult, SubjectScenarioResult } from "./result-types.ts";

interface TaskSpec {
	run(): unknown | Promise<unknown>;
	beforeEach?: () => MaybePromise<void>;
	afterEach?: () => MaybePromise<void>;
}

interface Scenario {
	readonly id: string;
	readonly name: string;
	readonly batchSize: number;
	supported(resolver: Resolver): boolean;
	task(resolver: Resolver): TaskSpec;
}

let _sink: unknown;

async function releaseAll(
	values: readonly { release(): MaybePromise<void> }[],
): Promise<void> {
	for (const value of values) await value.release();
}

function simpleScenario(
	id: string,
	name: string,
	batchSize: number,
	operation: (resolver: Resolver) => unknown,
): Scenario {
	return {
		id,
		name,
		batchSize,
		supported: () => true,
		task: (resolver) => ({
			run: () => {
				let value: unknown;
				for (let index = 0; index < batchSize; index += 1)
					value = operation(resolver);
				_sink = value;
			},
		}),
	};
}

function registrationScenario(): Scenario {
	const batchSize = 10;
	return {
		id: "registration",
		name: "Registration",
		batchSize,
		supported: (resolver) => resolver.registerGraph !== undefined,
		task: (resolver) => {
			const registerGraph = required(
				resolver.registerGraph,
				"Registration scenario requires registerGraph",
			);
			const graphs: ColdGraph[] = new Array(batchSize);
			return {
				run: () => {
					for (let index = 0; index < batchSize; index += 1) {
						graphs[index] = registerGraph();
					}
					_sink = graphs[batchSize - 1];
				},
				afterEach: () => releaseAll(graphs),
			};
		},
	};
}

function firstResolveScenario(): Scenario {
	const batchSize = 100;
	return {
		id: "first-resolve",
		name: "First resolve",
		batchSize,
		supported: () => true,
		task: (resolver) => {
			const graphs: ColdGraph[] = new Array(batchSize);
			return {
				beforeEach: () => {
					for (let index = 0; index < batchSize; index += 1) {
						graphs[index] = resolver.createColdGraph();
					}
				},
				run: () => {
					let value: unknown;
					for (const graph of graphs) value = graph.resolveService();
					_sink = value;
				},
				afterEach: () => releaseAll(graphs),
			};
		},
	};
}

function scopeCreationScenario(): Scenario {
	const batchSize = 100;
	return {
		id: "scope-creation",
		name: "Scope creation",
		batchSize,
		supported: () => true,
		task: (resolver) => {
			const scopes: ScopeHandle[] = new Array(batchSize);
			return {
				run: () => {
					for (let index = 0; index < batchSize; index += 1)
						scopes[index] = resolver.createScope();
					_sink = scopes[batchSize - 1];
				},
				afterEach: () => releaseAll(scopes),
			};
		},
	};
}

function firstScopedResolveScenario(): Scenario {
	const batchSize = 100;
	return {
		id: "first-scoped-resolve",
		name: "First scoped resolve",
		batchSize,
		supported: () => true,
		task: (resolver) => {
			const scopes: ScopeHandle[] = new Array(batchSize);
			return {
				beforeEach: () => {
					resolver.resolveLogger();
					for (let index = 0; index < batchSize; index += 1)
						scopes[index] = resolver.createScope();
				},
				run: () => {
					let value: unknown;
					for (const scope of scopes) value = scope.resolve();
					_sink = value;
				},
				afterEach: () => releaseAll(scopes),
			};
		},
	};
}

function warmScopedResolveScenario(): Scenario {
	const batchSize = 1000;
	return {
		id: "warm-scoped-resolve",
		name: "Warm scoped resolve",
		batchSize,
		supported: () => true,
		task: (resolver) => {
			let scope: ScopeHandle;
			return {
				beforeEach: () => {
					scope = resolver.createScope();
					scope.resolve();
				},
				run: () => {
					let value: unknown;
					for (let index = 0; index < batchSize; index += 1)
						value = scope.resolve();
					_sink = value;
				},
				afterEach: () => scope.release(),
			};
		},
	};
}

function asyncTeardownScenario(): Scenario {
	const batchSize = 100;
	return {
		id: "async-teardown",
		name: "Async teardown",
		batchSize,
		supported: (resolver) => resolver.teardown === "async",
		task: (resolver) => {
			const scopes: ScopeHandle[] = new Array(batchSize);
			return {
				beforeEach: () => {
					for (let index = 0; index < batchSize; index += 1) {
						const scope = resolver.createScope();
						scope.resolve();
						scopes[index] = scope;
					}
				},
				run: async () => {
					for (const scope of scopes) {
						const disposeAsync = required(
							scope.disposeAsync,
							"Async teardown scenario requires disposeAsync",
						);
						await disposeAsync();
					}
					_sink = scopes[batchSize - 1];
				},
				afterEach: () => releaseAll(scopes),
			};
		},
	};
}

export const scenarios: readonly Scenario[] = [
	simpleScenario("hot-singleton", "Hot singleton resolve", 1000, (resolver) =>
		resolver.resolveService(),
	),
	simpleScenario("transient", "Transient resolve", 250, (resolver) =>
		resolver.resolveTransient(),
	),
	simpleScenario("deep-graph", "Deep graph (10 levels)", 100, (resolver) =>
		resolver.resolveDeep(),
	),
	simpleScenario("wide-4", "Wide graph (4 dependencies)", 250, (resolver) =>
		resolver.resolveWide4(),
	),
	simpleScenario("wide-10", "Wide graph (10 dependencies)", 100, (resolver) =>
		resolver.resolveWide10(),
	),
	registrationScenario(),
	firstResolveScenario(),
	scopeCreationScenario(),
	firstScopedResolveScenario(),
	warmScopedResolveScenario(),
	asyncTeardownScenario(),
];

function rawResult(result: TaskResult): RawTaskResult {
	if (result.error) throw result.error;
	const medianBatchMs = median(result.samples);
	return {
		totalTimeMs: result.totalTime,
		minBatchMs: result.min,
		maxBatchMs: result.max,
		meanBatchMs: result.mean,
		medianBatchMs,
		hz: result.hz,
		rme: result.rme,
		sampleCount: result.samples.length,
	};
}

export async function runScenario(
	scenario: Scenario,
	subject: Subject,
	time: number,
	warmupTime: number,
): Promise<SubjectScenarioResult> {
	const resolver = subject.build();
	if (!scenario.supported(resolver)) {
		try {
			return {
				id: scenario.id,
				name: scenario.name,
				batchSize: scenario.batchSize,
				result: {
					subject: subject.name,
					supported: false,
					normalizedNsPerOp: null,
					raw: null,
				},
			};
		} finally {
			await resolver.release();
		}
	}

	const bench = new Bench({
		time,
		warmupTime,
		iterations: 10,
		warmupIterations: 5,
		throws: true,
	});
	const task = scenario.task(resolver);
	bench.add(subject.name, task.run, {
		beforeEach: task.beforeEach
			? async () => await task.beforeEach?.()
			: undefined,
		afterEach: task.afterEach
			? async () => {
					await task.afterEach?.();
					if (resolver.requiresCleanupTurn) await nextEventLoopTurn();
				}
			: undefined,
	});

	try {
		await bench.warmup();
		await bench.run();
		const measuredTask = required(
			bench.getTask(subject.name),
			`Tinybench task disappeared for ${subject.name}`,
		);
		const raw = rawResult(
			required(
				measuredTask.result,
				`Tinybench produced no result for ${subject.name}`,
			),
		);
		return {
			id: scenario.id,
			name: scenario.name,
			batchSize: scenario.batchSize,
			result: {
				subject: subject.name,
				supported: true,
				normalizedNsPerOp: (raw.medianBatchMs * 1_000_000) / scenario.batchSize,
				raw,
			},
		};
	} finally {
		bench.reset();
		bench.remove(subject.name);
		await resolver.release();
		await nextEventLoopTurn();
	}
}

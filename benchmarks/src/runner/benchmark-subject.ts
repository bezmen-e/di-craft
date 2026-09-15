import { orderSubjects, subjects } from "../containers/subjects.ts";
import type { SubjectProcessResult } from "./result-types.ts";
import { runScenario, scenarios } from "./scenarios.ts";

function positiveInteger(name: string, fallback?: number): number {
	const raw = Bun.env[name] ?? fallback;
	const value = Number(raw);
	if (!Number.isInteger(value) || value < 1)
		throw new Error(`${name} must be a positive integer`);
	return value;
}

function nonNegativeInteger(name: string): number {
	const value = Number(Bun.env[name]);
	if (!Number.isInteger(value) || value < 0) {
		throw new Error(`${name} must be a non-negative integer`);
	}
	return value;
}

function positiveNumber(name: string, fallback: number): number {
	const value = Number(Bun.env[name] ?? fallback);
	if (!Number.isFinite(value) || value <= 0)
		throw new Error(`${name} must be positive`);
	return value;
}

const round = positiveInteger("BENCH_ROUND", 1);
const subjectPosition = nonNegativeInteger("BENCH_SUBJECT_POSITION");
const time = positiveNumber("BENCH_TIME_MS", 75);
const warmupTime = positiveNumber("BENCH_WARMUP_MS", 30);
const output = Bun.env.BENCH_SUBJECT_OUTPUT;

if (!output) throw new Error("BENCH_SUBJECT_OUTPUT is required");

const orderedSubjects = orderSubjects(round);
const subject = orderedSubjects[subjectPosition];
if (!subject) {
	throw new Error(
		`BENCH_SUBJECT_POSITION must be less than ${orderedSubjects.length}`,
	);
}

process.stdout.write(
	`Subject ${subjectPosition + 1}/${orderedSubjects.length}: ${subject.name}\n`,
);
const scenarioResults = [];
for (const scenario of scenarios) {
	process.stdout.write(`  ${scenario.name}\n`);
	scenarioResults.push(await runScenario(scenario, subject, time, warmupTime));
}

const result: SubjectProcessResult = {
	round,
	subjectPosition,
	subject: subject.name,
	subjectOrder: orderedSubjects.map((candidate) => candidate.name),
	resultOrder: subjects.map((candidate) => candidate.name),
	timing: { timeMs: time, warmupTimeMs: warmupTime },
	scenarios: scenarioResults,
};

await Bun.write(output, `${JSON.stringify(result, null, 2)}\n`);

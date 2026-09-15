import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { arch, cpus, platform, release, tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { balancedBlockSize, subjects } from "../src/containers/subjects.ts";
import { itemAt } from "../src/invariant.ts";
import type { BenchmarkRun } from "../src/results.ts";
import type { SubjectProcessResult } from "../src/runner/result-types.ts";
import { mergeSubjectResults } from "./merge-benchmark-results.ts";

const benchmarkRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repositoryRoot = resolve(benchmarkRoot, "..");
const args = parseArgs(process.argv.slice(2));
const mode = args.mode ?? "quick";

if (mode !== "quick" && mode !== "public")
	throw new Error("--mode must be quick or public");

const blockSize = balancedBlockSize();
const rounds = positiveInteger(
	args.rounds ?? (mode === "public" ? blockSize : 1),
	"rounds",
);
const timeMs = positiveNumber(
	args.time ?? (mode === "public" ? 100 : 75),
	"time",
);
const warmupTimeMs = positiveNumber(
	args.warmup ?? (mode === "public" ? 50 : 30),
	"warmup",
);

if (mode === "public" && rounds % blockSize !== 0) {
	throw new Error(
		`Public mode requires complete ${blockSize}-round balanced blocks`,
	);
}

const stamp = new Date()
	.toISOString()
	.replaceAll(":", "-")
	.replaceAll(".", "-");
const outputPath = resolve(
	benchmarkRoot,
	args.output ?? `results/${mode}-${stamp}.json`,
);
const temporaryRoot = mkdtempSync(join(tmpdir(), "di-craft-bench-"));

try {
	if (mode === "public") {
		run([process.execPath, "install", "--frozen-lockfile"], repositoryRoot);
	}

	run([process.execPath, "run", "build:lib"], repositoryRoot);
	run([process.execPath, "run", "typecheck"], benchmarkRoot);
	run([process.execPath, "test", "src/precondition"], benchmarkRoot);

	const roundResults = [];
	for (let round = 1; round <= rounds; round += 1) {
		const partials: SubjectProcessResult[] = [];
		process.stdout.write(`\nBenchmark round ${round}/${rounds}\n`);

		for (
			let subjectPosition = 0;
			subjectPosition < subjects.length;
			subjectPosition += 1
		) {
			const subjectOutput = join(
				temporaryRoot,
				`round-${round}-subject-${subjectPosition}.json`,
			);
			run(
				[process.execPath, "run", "src/runner/benchmark-subject.ts"],
				benchmarkRoot,
				{
					BENCH_ROUND: String(round),
					BENCH_SUBJECT_POSITION: String(subjectPosition),
					BENCH_SUBJECT_OUTPUT: subjectOutput,
					BENCH_TIME_MS: String(timeMs),
					BENCH_WARMUP_MS: String(warmupTimeMs),
				},
			);
			partials.push(
				JSON.parse(readFileSync(subjectOutput, "utf8")) as SubjectProcessResult,
			);
		}

		roundResults.push(mergeSubjectResults(partials));
	}

	const raw: BenchmarkRun = {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		mode,
		artifact: {
			mode: "production",
			entry: "../packages/di-craft/dist/index.mjs",
		},
		git: {
			commit: capture(["git", "rev-parse", "HEAD"], repositoryRoot),
			dirty:
				capture(["git", "status", "--porcelain"], repositoryRoot).length > 0,
		},
		environment: {
			bun: Bun.version,
			os: `${platform()} ${release()}`,
			architecture: arch(),
			cpu: cpus()[0]?.model ?? "unknown",
			powerMode: await readPowerMode(),
		},
		dependencies: dependencyVersions(),
		configuration: {
			rounds,
			balancedBlockSize: blockSize,
			timeMs,
			warmupTimeMs,
			frozenLockfile: mode === "public",
			processIsolation: true,
			processIsolationLevel: "subject",
			subjectOrder: "balanced-latin-square",
		},
		rounds: roundResults,
	};

	await Bun.write(outputPath, `${JSON.stringify(raw, null, 2)}\n`);
	process.stdout.write(`\nRaw benchmark result: ${displayPath(outputPath)}\n`);
} finally {
	rmSync(temporaryRoot, { recursive: true, force: true });
}

function parseArgs(values: readonly string[]): Record<string, string> {
	const parsed: Record<string, string> = {};
	for (let index = 0; index < values.length; index += 1) {
		const argument = itemAt(values, index);
		if (argument === "--") continue;
		if (!argument.startsWith("--"))
			throw new Error(`Unexpected argument: ${argument}`);
		const name = argument.slice(2);
		const value = values[index + 1];
		if (!value || value.startsWith("--"))
			throw new Error(`Missing value for --${name}`);
		parsed[name] = value;
		index += 1;
	}
	return parsed;
}

function positiveInteger(value: string | number, name: string): number {
	const parsed = Number(value);
	if (!Number.isInteger(parsed) || parsed < 1)
		throw new Error(`--${name} must be a positive integer`);
	return parsed;
}

function positiveNumber(value: string | number, name: string): number {
	const parsed = Number(value);
	if (!Number.isFinite(parsed) || parsed <= 0)
		throw new Error(`--${name} must be positive`);
	return parsed;
}

function run(
	command: string[],
	cwd: string,
	extraEnvironment: Record<string, string> = {},
): void {
	const result = Bun.spawnSync({
		cmd: command,
		cwd,
		env: { ...process.env, ...extraEnvironment },
		stdout: "inherit",
		stderr: "inherit",
	});
	if (!result.success) {
		throw new Error(
			`${command.join(" ")} exited with status ${result.exitCode}`,
		);
	}
}

function capture(command: string[], cwd: string): string {
	const result = Bun.spawnSync({
		cmd: command,
		cwd,
		stdout: "pipe",
		stderr: "pipe",
	});
	if (!result.success) {
		throw new Error(
			`${command.join(" ")} exited with status ${result.exitCode}`,
		);
	}
	return result.stdout.toString().trim();
}

function dependencyVersions(): Record<string, string> {
	const benchmarkManifest = JSON.parse(
		readFileSync(join(benchmarkRoot, "package.json"), "utf8"),
	) as { devDependencies: Record<string, string> };
	const libraryManifest = JSON.parse(
		readFileSync(
			join(repositoryRoot, "packages/di-craft/package.json"),
			"utf8",
		),
	) as { version: string };
	return {
		"di-craft": libraryManifest.version,
		...Object.fromEntries(
			Object.entries(benchmarkManifest.devDependencies).filter(
				([name]) => name !== "di-craft",
			),
		),
	};
}

async function readPowerMode(): Promise<string | null> {
	const path = "/sys/devices/system/cpu/cpu0/cpufreq/scaling_governor";
	const file = Bun.file(path);
	return (await file.exists()) ? (await file.text()).trim() : null;
}

function displayPath(path: string): string {
	const display = relative(benchmarkRoot, path);
	return display.startsWith("..") ? path : display;
}

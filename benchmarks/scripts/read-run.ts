import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { BenchmarkRun } from "../src/results.ts";

const benchmarkRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

export interface LoadedRun {
	readonly raw: BenchmarkRun;
	readonly sourceName: string;
}

export function readRun(input: string): LoadedRun {
	const inputPath = resolve(process.cwd(), input);
	const raw = JSON.parse(readFileSync(inputPath, "utf8")) as BenchmarkRun;
	const relativeSource = relative(benchmarkRoot, inputPath);
	const sourceName = relativeSource.startsWith("..")
		? inputPath
		: relativeSource;
	return { raw, sourceName };
}

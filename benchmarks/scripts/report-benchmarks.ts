import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { required } from "../src/invariant.ts";
import type {
	AggregatedScenario,
	AggregatedSubjectResult,
	BenchmarkDocsData,
	BenchmarkRun,
} from "../src/results.ts";
import { median } from "../src/statistics.ts";

const benchmarkRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repositoryRoot = resolve(benchmarkRoot, "..");
const reportStart = "<!-- benchmark-report:start -->";
const reportEnd = "<!-- benchmark-report:end -->";

export { median };

export function mad(values: readonly number[]): number {
	const center = median(values);
	return median(values.map((value) => Math.abs(value - center)));
}

function expectedBlockSize(subjectCount: number): number {
	return subjectCount % 2 === 0 ? subjectCount : subjectCount * 2;
}

export function hasBalancedSubjectOrder(
	rounds: BenchmarkRun["rounds"],
): boolean {
	const subjectCount = rounds[0]?.subjectOrder.length;
	if (!Number.isInteger(subjectCount) || !subjectCount || subjectCount < 2)
		return false;
	const blockSize = expectedBlockSize(subjectCount);
	if (rounds.length < blockSize || rounds.length % blockSize !== 0)
		return false;

	const firstRound = rounds[0];
	if (!firstRound) return false;
	const subjectNames = new Set(firstRound.subjectOrder);
	if (subjectNames.size !== subjectCount) return false;
	const expectedPositionCount = blockSize / subjectCount;
	const expectedAdjacentCount =
		(blockSize * (subjectCount - 1)) / (subjectCount * (subjectCount - 1));
	const expectedRelativeOrder = blockSize / 2;

	for (
		let blockStart = 0;
		blockStart < rounds.length;
		blockStart += blockSize
	) {
		const positions = new Map<string, number>();
		const adjacentPairs = new Map<string, number>();
		const relativeOrder = new Map<string, number>();

		for (const round of rounds.slice(blockStart, blockStart + blockSize)) {
			const order = round.subjectOrder;
			if (
				order.length !== subjectCount ||
				new Set(order).size !== subjectCount ||
				order.some((subject) => !subjectNames.has(subject))
			) {
				return false;
			}

			for (let position = 0; position < subjectCount; position += 1) {
				const key = `${order[position]}\0${position}`;
				positions.set(key, (positions.get(key) ?? 0) + 1);
				if (position > 0) {
					const pair = `${order[position - 1]}\0${order[position]}`;
					adjacentPairs.set(pair, (adjacentPairs.get(pair) ?? 0) + 1);
				}
			}

			for (let left = 0; left < subjectCount; left += 1) {
				for (let right = left + 1; right < subjectCount; right += 1) {
					const pair = `${order[left]}\0${order[right]}`;
					relativeOrder.set(pair, (relativeOrder.get(pair) ?? 0) + 1);
				}
			}
		}

		for (const subject of subjectNames) {
			for (let position = 0; position < subjectCount; position += 1) {
				if (positions.get(`${subject}\0${position}`) !== expectedPositionCount)
					return false;
			}
			for (const other of subjectNames) {
				if (subject === other) continue;
				if (adjacentPairs.get(`${subject}\0${other}`) !== expectedAdjacentCount)
					return false;
				if (relativeOrder.get(`${subject}\0${other}`) !== expectedRelativeOrder)
					return false;
			}
		}
	}

	return true;
}

export function isPublishableResult(raw: BenchmarkRun): boolean {
	return (
		raw.mode === "public" &&
		raw.artifact.mode === "production" &&
		raw.configuration.frozenLockfile === true &&
		raw.configuration.processIsolationLevel === "subject" &&
		raw.configuration.subjectOrder === "balanced-latin-square" &&
		raw.configuration.timeMs >= 100 &&
		raw.configuration.warmupTimeMs >= 50 &&
		raw.configuration.balancedBlockSize ===
			expectedBlockSize(raw.rounds[0]?.subjectOrder.length ?? 0) &&
		hasBalancedSubjectOrder(raw.rounds)
	);
}

function aggregateScenario(
	raw: BenchmarkRun,
	scenarioId: string,
): AggregatedSubjectResult[] {
	const firstRound = required(raw.rounds[0], "Raw result has no rounds");
	const firstScenario = required(
		firstRound.scenarios.find((scenario) => scenario.id === scenarioId),
		`Raw result has no scenario ${scenarioId}`,
	);
	const subjects = firstScenario.results.map((result) => result.subject);
	const preliminary = subjects.map((subject) => {
		const values = raw.rounds.map((round) => {
			const scenario = required(
				round.scenarios.find((candidate) => candidate.id === scenarioId),
				`Round ${round.round} has no scenario ${scenarioId}`,
			);
			return required(
				scenario.results.find((candidate) => candidate.subject === subject),
				`Round ${round.round}/${scenarioId} has no subject ${subject}`,
			).normalizedNsPerOp;
		});
		const supported = values.filter((value): value is number => value !== null);
		if (supported.length === 0) return { subject, medianNs: null, madNs: null };
		if (supported.length !== raw.rounds.length) {
			throw new Error(
				`${scenarioId}/${subject} changes support status between rounds`,
			);
		}
		return { subject, medianNs: median(supported), madNs: mad(supported) };
	});
	const supportedMedians = preliminary
		.map((result) => result.medianNs)
		.filter((value): value is number => value !== null);
	const best =
		supportedMedians.length > 0 ? Math.min(...supportedMedians) : null;

	return preliminary.map((result) => {
		const relative =
			result.medianNs === null || best === null ? null : result.medianNs / best;
		const rank =
			result.medianNs === null
				? null
				: 1 +
					supportedMedians.filter((value) => value < result.medianNs).length;
		const medianText =
			result.medianNs === null ? "N/A" : formatNumber(result.medianNs);
		const madText = result.madNs === null ? "N/A" : formatNumber(result.madNs);
		const relativeText = relative === null ? "N/A" : `${relative.toFixed(2)}×`;
		return {
			...result,
			relative,
			rank,
			medianText,
			madText,
			relativeText,
			combinedText:
				result.medianNs === null || result.madNs === null || relative === null
					? "N/A"
					: `${medianText} ± ${madText} (${relativeText})`,
		};
	});
}

export function aggregateRun(raw: BenchmarkRun): AggregatedScenario[] {
	validateRaw(raw);
	return required(raw.rounds[0], "Raw result has no rounds").scenarios.map(
		(scenario) => ({
			id: scenario.id,
			name: scenario.name,
			results: aggregateScenario(raw, scenario.id),
		}),
	);
}

export function createDocsData(
	raw: BenchmarkRun,
	sourceName: string,
): BenchmarkDocsData {
	const scenarios = aggregateRun(raw);
	return {
		schemaVersion: 1,
		published: isPublishableResult(raw),
		sourceResult: `benchmarks/${sourceName}`,
		generatedAt: raw.generatedAt,
		git: raw.git,
		environment: raw.environment,
		configuration: raw.configuration,
		subjects: required(scenarios[0], "Raw result has no scenarios").results.map(
			(result) => result.subject,
		),
		scenarios,
	};
}

export function renderReport(raw: BenchmarkRun, sourceName: string): string {
	const scenarios = aggregateRun(raw);
	const subjects = scenarios[0]?.results.map((result) => result.subject) ?? [];
	const lines = [
		"## Generated benchmark results",
		"",
		raw.mode === "public"
			? `Production artifact result from \`${sourceName}\`.`
			: `Local quick result from \`${sourceName}\`; do not use it for public claims.`,
		"",
		`Commit: \`${raw.git.commit}\`${raw.git.dirty ? " (dirty workspace)" : ""}\\`,
		`Environment: Bun ${raw.environment.bun}, ${raw.environment.os}, ${raw.environment.architecture}, ${raw.environment.cpu}\\`,
		`Rounds: ${raw.configuration.rounds}; central value: median; dispersion: MAD. Lower is better.`,
		"",
	];

	for (const scenario of scenarios) {
		lines.push(`### ${scenario.name}`, "");
		lines.push("| Subject | Median ns/op | MAD ns/op | Relative | Rank |");
		lines.push("|---|---:|---:|---:|---:|");
		for (const result of scenario.results) {
			lines.push(
				`| ${result.subject} | ${result.medianText} | ${result.madText} | ${result.relativeText} | ${result.rank ?? "N/A"} |`,
			);
		}
		lines.push("");
	}

	lines.push("## Combined benchmark results", "");
	lines.push("### Median ns/op", "", "Median in ns/op.", "");
	lines.push(
		...renderCombinedTable(
			subjects,
			scenarios,
			(result) => result?.medianText ?? "N/A",
		),
		"",
	);
	lines.push(
		"### Relative to fastest",
		"",
		"Relative to the fastest subject in each scenario.",
		"",
	);
	lines.push(
		...renderCombinedTable(
			subjects,
			scenarios,
			(result) => result?.relativeText ?? "N/A",
		),
		"",
	);
	lines.push("### Median ± MAD with relative", "");
	lines.push(
		"Median ± MAD in ns/op; the value in parentheses is relative to the fastest subject.",
		"",
	);
	lines.push(
		...renderCombinedTable(
			subjects,
			scenarios,
			(result) => result?.combinedText ?? "N/A",
		),
	);

	return `${lines.join("\n").trimEnd()}\n`;
}

function renderCombinedTable(
	subjects: readonly string[],
	scenarios: readonly AggregatedScenario[],
	formatCell: (result: AggregatedSubjectResult | undefined) => string,
): string[] {
	const lines = [
		`| Scenario | ${subjects.join(" | ")} |`,
		`|---|${subjects.map(() => "---:").join("|")}|`,
	];
	for (const scenario of scenarios) {
		const bySubject = new Map(
			scenario.results.map((result) => [result.subject, result]),
		);
		lines.push(
			`| ${scenario.name} | ${subjects.map((subject) => formatCell(bySubject.get(subject))).join(" | ")} |`,
		);
	}
	return lines;
}

export function validateRaw(raw: BenchmarkRun): void {
	if (raw.schemaVersion !== 1)
		throw new Error(`Unsupported schema version: ${raw.schemaVersion}`);
	if (raw.rounds.length === 0) throw new Error("Raw result has no rounds");
	if (raw.configuration.rounds !== raw.rounds.length) {
		throw new Error("Raw result round count does not match configuration");
	}

	const firstRound = required(raw.rounds[0], "Raw result has no rounds");
	const scenarioIds = firstRound.scenarios.map((scenario) => scenario.id);
	const subjects = firstRound.scenarios[0]?.results.map(
		(result) => result.subject,
	);
	if (!subjects || subjects.length === 0)
		throw new Error("Raw result has no subjects");
	for (const round of raw.rounds) {
		if (round.subjectOrder.length !== subjects.length) {
			throw new Error(`Round ${round.round} has an invalid subject order`);
		}
		if (
			JSON.stringify(round.scenarios.map((scenario) => scenario.id)) !==
			JSON.stringify(scenarioIds)
		) {
			throw new Error(`Round ${round.round} has a different scenario set`);
		}
		for (const scenario of round.scenarios) {
			if (
				JSON.stringify(scenario.results.map((result) => result.subject)) !==
				JSON.stringify(subjects)
			) {
				throw new Error(
					`Round ${round.round}/${scenario.id} has a different subject set`,
				);
			}
		}
	}
}

function formatNumber(value: number): string {
	if (value >= 1000) return value.toFixed(1);
	if (value >= 100) return value.toFixed(2);
	return value.toFixed(3);
}

function replaceGeneratedReport(readme: string, report: string): string {
	const start = readme.indexOf(reportStart);
	const end = readme.indexOf(reportEnd);
	if (start === -1 || end === -1 || end < start) {
		throw new Error("README does not contain benchmark report markers");
	}
	return `${readme.slice(0, start + reportStart.length)}\n${report.trimEnd()}\n${readme.slice(end)}`;
}

async function main(): Promise<void> {
	const values = process.argv.slice(2).filter((value) => value !== "--");
	const input = values.find((value) => !value.startsWith("--"));
	const write = values.includes("--write");
	if (!input)
		throw new Error(
			"Usage: bun run scripts/report-benchmarks.ts <raw.json> [--write]",
		);

	const inputPath = resolve(process.cwd(), input);
	const raw = JSON.parse(readFileSync(inputPath, "utf8")) as BenchmarkRun;
	const relativeSource = relative(benchmarkRoot, inputPath);
	const sourceName = relativeSource.startsWith("..")
		? inputPath
		: relativeSource;
	const report = renderReport(raw, sourceName);
	if (report !== renderReport(raw, sourceName))
		throw new Error("Report generation is not deterministic");

	if (write) {
		if (!isPublishableResult(raw)) {
			throw new Error(
				"Only a frozen-lockfile production result with complete balanced subject-order blocks can update published output",
			);
		}
		const readmePath = resolve(benchmarkRoot, "README.md");
		const docsDataPath = resolve(
			repositoryRoot,
			"docs/src/data/benchmarks.json",
		);
		const readme = readFileSync(readmePath, "utf8");
		const docsData = createDocsData(raw, sourceName);
		await Promise.all([
			Bun.write(readmePath, replaceGeneratedReport(readme, report)),
			Bun.write(docsDataPath, `${JSON.stringify(docsData, null, 2)}\n`),
		]);
		process.stdout.write(`Updated ${readmePath}\nUpdated ${docsDataPath}\n`);
	} else {
		process.stdout.write(report);
	}
}

if (import.meta.main) await main();

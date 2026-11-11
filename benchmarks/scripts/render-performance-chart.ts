import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { required } from "../src/invariant.ts";
import type { BenchmarkRun } from "../src/results.ts";
import { readRun } from "./read-run.ts";
import {
	aggregateRun,
	formatNumber,
	isPublishableResult,
} from "./report-benchmarks.ts";

const benchmarkRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const defaultOutput = resolve(
	benchmarkRoot,
	"../docs/src/assets/performance-chart.svg",
);

const palette: Readonly<Record<string, string>> = {
	"di-craft": "#4f8cff",
	InversifyJS: "#b39aff",
	"Awilix PROXY": "#db9bea",
	"Awilix CLASSIC": "#e8799f",
	TSyringe: "#f3ba72",
	TypeDI: "#9aa7bd",
	"Typed Inject": "#7fd1c1",
};
const fallbackColor = "#c9d4e5";

const width = 1200;
const padding = 40;
const barLabelX = 215;
const barX = 240;
const barMaxWidth = 800;
const rowHeight = 56;
const barHeight = 32;
const tabHeight = 34;
const tabRowPitch = 44;
const tabsTop = 152;
const tabGap = 10;
const tabMaxRowWidth = width - padding * 2;

interface Scene {
	readonly name: string;
	readonly values: readonly (number | null)[];
}

interface TabPosition {
	readonly x: number;
	readonly y: number;
	readonly width: number;
}

function escapeXml(value: string): string {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

function tabWidth(label: string): number {
	return Math.round(label.length * 6.9 + 30);
}

function layoutTabs(labels: readonly string[]): readonly TabPosition[] {
	let row = 0;
	let cursor = padding;
	const positions: TabPosition[] = [];
	for (const label of labels) {
		const tabWidthValue = tabWidth(label);
		if (cursor > padding && cursor + tabWidthValue > padding + tabMaxRowWidth) {
			row += 1;
			cursor = padding;
		}
		positions.push({
			x: cursor,
			y: tabsTop + row * tabRowPitch,
			width: tabWidthValue,
		});
		cursor += tabWidthValue + tabGap;
	}
	return positions;
}

function sortOrder(values: readonly (number | null)[]): readonly number[] {
	return values
		.map((_, index) => index)
		.sort((left, right) => {
			const leftValue = values[left] ?? Number.POSITIVE_INFINITY;
			const rightValue = values[right] ?? Number.POSITIVE_INFINITY;
			return leftValue - rightValue || left - right;
		});
}

function maxValue(values: readonly (number | null)[]): number {
	let max = 0;
	for (const value of values) {
		if (value !== null && value > max) max = value;
	}
	return max === 0 ? 1 : max;
}

function barWidth(value: number | null, max: number): number {
	if (value === null) return 0;
	return Math.max(2, (barMaxWidth * value) / max);
}

const chartScript = `
(()=>{
const data=__DATA__;
const names=__NAMES__;
const BAR_X=240,BAR_MAX=800,ROW_H=56;
const root=document.querySelector('.bench-chart');
if(!root)return;
const tabs=Array.prototype.slice.call(root.querySelectorAll('.tab'));
const rows=names.map(function(_,i){
const el=root.querySelector('#row-'+i);
return {el:el,bar:el.querySelector('.bar'),label:el.querySelector('.value'),title:el.querySelector('title'),y:0,w:0};
});
let frame=0;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
function fmt(v){return v>=1000?v.toFixed(1):v>=100?v.toFixed(2):v.toFixed(3)}
function select(index){
if(frame)cancelAnimationFrame(frame);
const scene=data[index];
root.querySelector('#scenario-title').textContent=scene.name;
root.querySelector('#chart').setAttribute('aria-labelledby','tab-'+index);
tabs.forEach(function(tab,i){
tab.setAttribute('aria-selected',i===index?'true':'false');
tab.tabIndex=i===index?0:-1;
});
const key=scene.values.map(function(v){return v===null?Infinity:v});
const order=names.map(function(_,i){return i}).sort(function(a,b){return key[a]-key[b]||a-b});
let max=0;
scene.values.forEach(function(v){if(v!==null&&v>max)max=v});
if(max===0)max=1;
const target=rows.map(function(){return {y:0,w:0}});
order.forEach(function(subject,position){
const v=scene.values[subject];
target[subject]={y:position*ROW_H,w:v===null?0:Math.max(2,BAR_MAX*v/max)};
});
rows.forEach(function(row,i){
const v=scene.values[i];
row.label.textContent=v===null?'N/A':fmt(v);
row.title.textContent=names[i]+': '+(v===null?'N/A':fmt(v)+' ns/op');
});
const from=rows.map(function(row){return {y:row.y,w:row.w}});
const duration=reduced.matches?0:550;
const start=performance.now();
function step(now){
const p=duration===0?1:Math.min(1,(now-start)/duration);
const e=1-Math.pow(1-p,3);
rows.forEach(function(row,i){
const y=from[i].y+(target[i].y-from[i].y)*e;
const w=Math.max(0,from[i].w+(target[i].w-from[i].w)*e);
row.el.setAttribute('transform','translate(0 '+y.toFixed(2)+')');
row.bar.setAttribute('width',w.toFixed(2));
row.label.setAttribute('x',(BAR_X+w+12).toFixed(2));
row.y=y;row.w=w;
});
if(p<1)frame=requestAnimationFrame(step);else frame=0;
}
frame=requestAnimationFrame(step);
}
tabs.forEach(function(tab,i){
tab.addEventListener('click',function(){select(i)});
tab.addEventListener('keydown',function(event){
if(event.key==='ArrowRight'){event.preventDefault();const n=(i+1)%tabs.length;tabs[n].focus();select(n);}
else if(event.key==='ArrowLeft'){event.preventDefault();const n=(i-1+tabs.length)%tabs.length;tabs[n].focus();select(n);}
});
});
rows.forEach(function(row){
const y=Number(row.el.getAttribute('transform').match(/-?[\\d.]+/g)[1]);
row.y=y;
row.w=Number(row.bar.getAttribute('width'));
});
select(0);
})();
`;

export function renderPerformanceChart(
	raw: BenchmarkRun,
	sourceName: string,
): string {
	if (!isPublishableResult(raw)) {
		throw new Error(
			"Only a frozen-lockfile production result with complete balanced subject-order blocks can render the performance chart",
		);
	}
	const scenarios = aggregateRun(raw);
	const firstScenario = required(scenarios[0], "Result has no scenarios");
	const subjects = firstScenario.results.map((result) => result.subject);
	const scenes: readonly Scene[] = scenarios.map((scenario) => ({
		name: scenario.name,
		values: scenario.results.map((result) =>
			result.medianNs === null ? null : Number(formatNumber(result.medianNs)),
		),
	}));
	const colors = subjects.map((subject) => palette[subject] ?? fallbackColor);

	const tabs = layoutTabs(scenes.map((scene) => scene.name));
	const tabRows =
		1 + Math.max(...tabs.map((tab) => tab.y - tabsTop)) / tabRowPitch;
	const tabsBottom = tabsTop + (tabRows - 1) * tabRowPitch + tabHeight;
	const chartTop = tabsBottom + 30;
	const footerY = chartTop + subjects.length * rowHeight + 36;
	const height = footerY + 32;

	const initialScene = firstScenario;
	const initialValues = scenes[0]?.values ?? [];
	const order = sortOrder(initialValues);
	const max = maxValue(initialValues);

	const rowMarkup = subjects.map((subject, index) => {
		const value = initialValues[index] ?? null;
		const barWidthValue = barWidth(value, max);
		const position = order.indexOf(index);
		const label = value === null ? "N/A" : formatNumber(value);
		const title =
			value === null
				? `${subject}: N/A`
				: `${subject}: ${formatNumber(value)} ns/op`;
		const valueX = barX + barWidthValue + 12;
		return [
			`<g id="row-${index}" transform="translate(0 ${position * rowHeight})">`,
			`<title>${escapeXml(title)}</title>`,
			`<text class="name" x="${barLabelX}" y="21" text-anchor="end">${escapeXml(subject)}</text>`,
			`<rect class="bar" x="${barX}" y="0" width="${barWidthValue.toFixed(2)}" height="${barHeight}" rx="5" fill="${colors[index]}"/>`,
			`<text class="value" x="${valueX.toFixed(2)}" y="21">${label}</text>`,
			"</g>",
		].join("");
	});

	const tabMarkup = scenes.map((scene, index) => {
		const tab = required(tabs[index], "Missing tab position");
		const selected = index === 0;
		return [
			`<g class="tab" id="tab-${index}" role="tab" aria-selected="${selected}" tabindex="${selected ? 0 : -1}" transform="translate(${tab.x} ${tab.y})">`,
			`<rect width="${tab.width}" height="${tabHeight}" rx="17"/>`,
			`<text x="${(tab.width / 2).toFixed(1)}" y="22" text-anchor="middle">${escapeXml(scene.name)}</text>`,
			"</g>",
		].join("");
	});

	const script = chartScript
		.replace(
			"__DATA__",
			JSON.stringify(
				scenes.map((scene) => ({
					name: scene.name,
					values: scene.values,
				})),
			),
		)
		.replace("__NAMES__", JSON.stringify(subjects));

	return [
		`<svg xmlns="http://www.w3.org/2000/svg" class="bench-chart" viewBox="0 0 ${width} ${height}" width="100%" style="max-width:${width}px" role="group" aria-labelledby="chart-title chart-desc" lang="en">`,
		'<title id="chart-title">di-craft benchmark comparison</title>',
		`<desc id="chart-desc">Interactive bar chart of median nanoseconds per operation for ${subjects.length} DI containers across ${scenes.length} benchmark scenarios. Lower is better. Select a scenario tab to update the chart.</desc>`,
		"<style>",
		'.bench-chart text{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;fill:#e6edf5}',
		".bench-chart .muted{fill:#91a0b7}",
		".bench-chart .tab{cursor:pointer;outline:none}",
		".bench-chart .tab rect{fill:#182336;stroke:#2c3a50;stroke-width:1}",
		".bench-chart .tab text{font-size:13px;fill:#b7c4d7;pointer-events:none}",
		".bench-chart .tab:hover rect{fill:#24364b}",
		'.bench-chart .tab[aria-selected="true"] rect{fill:#4f8cff;stroke:#4f8cff}',
		'.bench-chart .tab[aria-selected="true"] text{fill:#fff;font-weight:650}',
		".bench-chart .tab:focus-visible rect{stroke:#fff;stroke-width:2}",
		".bench-chart .name{font-size:16px;font-weight:550}",
		".bench-chart .value{font-size:15px;font-variant-numeric:tabular-nums;font-weight:600}",
		"</style>",
		`<rect width="${width}" height="${height}" rx="24" fill="#0c1422"/>`,
		`<text x="${padding}" y="44" class="muted" font-size="11" letter-spacing="2.3">DEPENDENCY INJECTION / BENCHMARK</text>`,
		`<text id="scenario-title" x="${padding}" y="92" font-size="22" font-weight="600">${escapeXml(initialScene.name)}</text>`,
		`<text x="${padding}" y="124" class="muted" font-size="13">Nanoseconds per operation (ns/op) · linear scale per scenario · lower is better</text>`,
		'<g id="tabs" role="tablist" aria-label="Benchmark scenarios">',
		tabMarkup.join("\n"),
		"</g>",
		`<g id="chart" role="tabpanel" aria-labelledby="tab-0" transform="translate(0 ${chartTop})">`,
		rowMarkup.join("\n"),
		"</g>",
		`<text x="${padding}" y="${footerY}" class="muted" font-size="12">Median of ${raw.configuration.rounds} balanced rounds · Bun ${raw.environment.bun} · ${escapeXml(raw.environment.cpu)} · source: ${escapeXml(sourceName)}</text>`,
		"<script><![CDATA[",
		script,
		"]]></script>",
		"</svg>",
		"",
	].join("\n");
}

async function main(): Promise<void> {
	const values = process.argv.slice(2).filter((value) => value !== "--");
	let outputPath = defaultOutput;
	let rest = values;
	const outIndex = values.indexOf("--out");
	if (outIndex !== -1) {
		const outValue = required(values[outIndex + 1], "--out requires a path");
		outputPath = resolve(process.cwd(), outValue);
		rest = values.filter(
			(_, index) => index !== outIndex && index !== outIndex + 1,
		);
	}
	const input = rest.find((value) => !value.startsWith("--"));
	if (!input) {
		throw new Error(
			"Usage: bun run scripts/render-performance-chart.ts <raw.json> [--out <path>]",
		);
	}

	const { raw, sourceName } = readRun(input);
	const svg = renderPerformanceChart(raw, sourceName);
	if (svg !== renderPerformanceChart(raw, sourceName)) {
		throw new Error("Chart generation is not deterministic");
	}
	await Bun.write(outputPath, svg);
	process.stdout.write(`Wrote ${outputPath}\n`);
}

if (import.meta.main) await main();

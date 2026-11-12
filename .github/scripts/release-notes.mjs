#!/usr/bin/env node
// Extracts the changelog entry for a package version and prints it as
// Markdown release notes. Used by the tag-triggered GitHub Release workflow.
//
// Usage: node .github/scripts/release-notes.mjs <version>
//
// Recognizes both changelog header formats in the file: the changesets
// format (`## 0.0.37`) and the Keep a Changelog format used by older,
// reconstructed entries (`## [0.0.35] - 2026-11-12`). Grouped range headers
// such as `## [0.0.29]-[0.0.32]` intentionally match no single version.

import { readFileSync } from "node:fs";

const CHANGELOG_PATH = "packages/di-craft/CHANGELOG.md";
// Boilerplate paragraphs of the changelog preamble and `[ref]: url` link
// definitions are not release notes.
const BOILERPLATE =
	/^(All notable changes|The format is based|Versions below|Entries before|\[)/;

function fail(message) {
	process.stderr.write(`release-notes: ${message}\n`);
	process.exit(1);
}

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+$/.test(version)) {
	fail(
		`expected a plain semver version argument, got: ${JSON.stringify(version)}`,
	);
}

const escaped = version.replace(/\./g, "\\.");
const header = new RegExp(`^## \\[?v?${escaped}\\]?(\\s|$)`);

const lines = readFileSync(CHANGELOG_PATH, "utf8").split("\n");
const start = lines.findIndex((line) => header.test(line));
if (start === -1) {
	fail(`no changelog entry for version ${version}`);
}

const body = [];
for (let i = start + 1; i < lines.length; i += 1) {
	if (/^## /.test(lines[i])) {
		break;
	}
	body.push(lines[i]);
}

const paragraphs = body
	.join("\n")
	.split(/\n{2,}/)
	.map((paragraph) => paragraph.trim())
	.filter((paragraph) => paragraph.length > 0 && !BOILERPLATE.test(paragraph));

if (paragraphs.length === 0) {
	fail(`changelog entry for version ${version} is empty`);
}

process.stdout.write(`${paragraphs.join("\n\n")}\n`);

import { PageEvent } from "typedoc";

const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
const maxDescriptionLength = 160;

const readFrontmatterString = (frontmatter, key) => {
	const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
	if (!match) return undefined;

	const value = match[1].trim();
	try {
		const parsed = JSON.parse(value);
		return typeof parsed === "string" ? parsed : value;
	} catch {
		return value.replace(/^["']|["']$/g, "");
	}
};

const toPlainText = (markdown) =>
	markdown
		.replace(/<!--[\s\S]*?-->/g, " ")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/<[^>]+>/g, " ")
		.replace(/[`*_~]/g, "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/\s+/g, " ")
		.trim();

const extractSummary = (contents) => {
	const body = contents.replace(frontmatterPattern, "");
	const blocks = body.split(/\r?\n\s*\r?\n/);

	for (const block of blocks) {
		const candidate = block.trim();
		if (
			candidate.length === 0 ||
			candidate.startsWith("#") ||
			candidate.startsWith("```") ||
			candidate.startsWith("<table") ||
			candidate.startsWith("<details") ||
			candidate.startsWith("---")
		) {
			continue;
		}

		const summary = toPlainText(candidate);
		if (summary.length > 0) return summary;
	}

	return undefined;
};

const truncate = (value, limit) => {
	if (value.length <= limit) return value;
	const shortened = value.slice(0, Math.max(0, limit - 1));
	const lastSpace = shortened.lastIndexOf(" ");
	return `${shortened.slice(0, lastSpace > 40 ? lastSpace : undefined).trimEnd()}…`;
};

const createDescription = (summary, title, apiName) => {
	const context =
		title === apiName
			? `di-craft ${apiName} documentation.`
			: `${title} in the di-craft ${apiName}.`;

	if (!summary) return context;

	const summaryLimit = maxDescriptionLength - context.length - 1;
	return `${truncate(summary, summaryLimit)} ${context}`;
};

const updateFrontmatter = (contents, title, description, sidebarLabel) => {
	const match = contents.match(frontmatterPattern);
	if (!match) return contents;

	let frontmatter = match[1];
	frontmatter = frontmatter.replace(
		/^title:.*$/m,
		`title: ${JSON.stringify(title)}`,
	);

	if (/^description:/m.test(frontmatter)) {
		frontmatter = frontmatter.replace(
			/^description:.*$/m,
			`description: ${JSON.stringify(description)}`,
		);
	} else {
		frontmatter = `${frontmatter}\ndescription: ${JSON.stringify(description)}`;
	}

	if (!/^sidebar:/m.test(frontmatter)) {
		frontmatter = `${frontmatter}\nsidebar:\n  label: ${JSON.stringify(sidebarLabel)}`;
	}

	return `---\n${frontmatter}\n---\n${contents.slice(match[0].length)}`;
};

export const load = (app) => {
	app.renderer.on(
		PageEvent.END,
		(event) => {
			if (!event.contents) return;

			const frontmatter = event.contents.match(frontmatterPattern)?.[1];
			if (!frontmatter) return;

			const rawTitle =
				readFrontmatterString(frontmatter, "title") ?? event.model.name;
			const apiName = event.project.name;
			const title = rawTitle === apiName ? apiName : `${rawTitle} · ${apiName}`;
			const description = createDescription(
				extractSummary(event.contents),
				rawTitle,
				apiName,
			);

			event.contents = updateFrontmatter(
				event.contents,
				title,
				description,
				rawTitle,
			);
		},
		-100,
	);
};

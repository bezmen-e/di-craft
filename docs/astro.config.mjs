// @ts-check

import { fileURLToPath } from "node:url";
import mdx from "@astrojs/mdx";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightLlmsTxt from "starlight-llms-txt";
import { createStarlightTypeDocPlugin } from "starlight-typedoc";

const siteUrl = "https://di-craft.pages.dev";
const socialImageUrl = `${siteUrl}/og-image.png`;
const typeDocSeoPlugin = fileURLToPath(
	new URL("./scripts/typedoc-seo.mjs", import.meta.url),
);

const coreApiLinks = {
	Container: `${siteUrl}/api/di-craft/type-aliases/container/`,
	Provider: `${siteUrl}/api/di-craft/type-aliases/provider/`,
	Token: `${siteUrl}/api/di-craft/type-aliases/token/`,
};

const [coreTypeDoc, coreTypeDocSidebar] = createStarlightTypeDocPlugin();
const [nodeTypeDoc, nodeTypeDocSidebar] = createStarlightTypeDocPlugin();
const [nextServerTypeDoc, nextServerTypeDocSidebar] =
	createStarlightTypeDocPlugin();
const [nextClientTypeDoc, nextClientTypeDocSidebar] =
	createStarlightTypeDocPlugin();

/** @type {NonNullable<import("starlight-typedoc").StarlightTypeDocOptions["typeDoc"]>} */
const typeDoc = {
	useCodeBlocks: true,
	parametersFormat: "htmlTable",
	propertyMembersFormat: "htmlTable",
	disableSources: true,
	excludeExternals: true,
	excludeInternal: true,
	excludePrivate: true,
	plugin: [typeDocSeoPlugin],
	readme: "none",
	sort: ["source-order"],
	treatValidationWarningsAsErrors: true,
	validation: {
		invalidLink: true,
		invalidPath: true,
		notDocumented: true,
		notExported: true,
		rewrittenLink: true,
		unusedMergeModuleWith: true,
	},
};

const plugins = [
	coreTypeDoc({
		entryPoints: ["../packages/di-craft/src/index.ts"],
		output: "api/di-craft",
		sidebar: { label: "di-craft" },
		tsconfig: "../packages/di-craft/tsconfig/src.json",
		typeDoc: { ...typeDoc, name: "Core API" },
		watch: true,
	}),
	nodeTypeDoc({
		entryPoints: ["../packages/di-craft/src/adapters/node/server.ts"],
		output: "api/node",
		sidebar: { label: "di-craft/node" },
		tsconfig: "../packages/di-craft/tsconfig/node.json",
		typeDoc: {
			...typeDoc,
			externalSymbolLinkMappings: { "di-craft": coreApiLinks },
			name: "Node.js API",
		},
		watch: true,
	}),
	nextServerTypeDoc({
		entryPoints: ["../packages/di-craft/src/adapters/next/server.ts"],
		output: "api/next/server",
		sidebar: { label: "di-craft/next/server" },
		tsconfig: "../packages/di-craft/tsconfig/src.json",
		typeDoc: {
			...typeDoc,
			externalSymbolLinkMappings: { "di-craft": coreApiLinks },
			name: "Next.js server API",
		},
		watch: true,
	}),
	nextClientTypeDoc({
		entryPoints: ["../packages/di-craft/src/adapters/next/client.ts"],
		output: "api/next/client",
		sidebar: { label: "di-craft/next/client" },
		tsconfig: "../packages/di-craft/tsconfig/src.json",
		typeDoc: {
			...typeDoc,
			externalSymbolLinkMappings: {
				"di-craft": {
					...coreApiLinks,
					DehydrateOptions: `${siteUrl}/api/next/server/type-aliases/dehydrateoptions/`,
				},
			},
			name: "Next.js client API",
		},
		watch: true,
	}),
	starlightLlmsTxt({
		projectName: "di-craft",
		exclude: ["api/**"],
		customSets: [
			{
				label: "Start here",
				description: "Installation and a first dependency graph with di-craft.",
				paths: ["start-here/**"],
			},
			{
				label: "Concepts",
				description: "The design and core concepts behind di-craft.",
				paths: ["concepts/**"],
			},
			{
				label: "Guides",
				description: "Framework and runtime guides for di-craft.",
				paths: ["guides/**"],
			},
			{
				label: "API Reference",
				description: "Generated API reference for every public entry point.",
				paths: ["api/**"],
			},
		],
	}),
];

export default defineConfig({
	site: siteUrl,
	compressHTML: true,
	integrations: [
		starlight({
			title: "di-craft",
			description:
				"A small, type-safe dependency injection library for TypeScript.",
			favicon: "/favicon.svg",
			logo: {
				src: "./public/favicon.svg",
				alt: "",
			},
			head: [
				{
					tag: "meta",
					attrs: { property: "og:image", content: socialImageUrl },
				},
				{
					tag: "meta",
					attrs: {
						property: "og:image:alt",
						content: "di-craft — type-safe dependency injection for TypeScript",
					},
				},
				{
					tag: "meta",
					attrs: { property: "og:image:type", content: "image/png" },
				},
				{
					tag: "meta",
					attrs: { property: "og:image:width", content: "1200" },
				},
				{
					tag: "meta",
					attrs: { property: "og:image:height", content: "630" },
				},
				{
					tag: "meta",
					attrs: { name: "twitter:image", content: socialImageUrl },
				},
				{
					tag: "meta",
					attrs: {
						name: "twitter:image:alt",
						content: "di-craft — type-safe dependency injection for TypeScript",
					},
				},
			],
			editLink: {
				baseUrl: "https://github.com/bezmen-e/di-craft/edit/main/docs/",
			},
			lastUpdated: true,
			customCss: ["./src/styles/global.css"],
			components: {
				Hero: "./src/components/Hero.astro",
			},
			expressiveCode: {
				themes: ["github-light", "github-dark"],
			},
			social: [
				{
					href: "https://github.com/bezmen-e/di-craft",
					icon: "github",
					label: "GitHub",
				},
			],
			sidebar: [
				{ label: "Overview", link: "/" },
				{
					label: "Start here",
					items: ["start-here/installation", "start-here/getting-started"],
				},
				{
					label: "Concepts",
					collapsed: true,
					items: [
						"concepts/why-di-craft",
						"concepts/tokens-and-providers",
						"concepts/containers-and-scopes",
						"concepts/disposal",
					],
				},
				{
					label: "Guides",
					collapsed: true,
					items: [
						"guides/annotations",
						"guides/nodejs",
						{
							label: "Next.js",
							collapsed: true,
							items: [
								"guides/nextjs",
								"guides/nextjs/server-components",
								"guides/nextjs/route-handlers-and-actions",
								"guides/nextjs/async-local-storage",
								"guides/nextjs/hydration",
							],
						},
					],
				},
				{
					label: "API Reference",
					collapsed: true,
					items: [
						coreTypeDocSidebar,
						nodeTypeDocSidebar,
						nextServerTypeDocSidebar,
						nextClientTypeDocSidebar,
					],
				},
			],
			plugins,
		}),
		mdx({ gfm: true, optimize: true }),
	],
});

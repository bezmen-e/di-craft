import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightTypeDoc from "starlight-typedoc";

export default defineConfig({
	integrations: [
		starlight({
			title: "di-craft",
			social: [
				{
					href: "https://github.com/bezmen-e/di-craft",
					icon: "github",
					label: "GitHub",
				},
			],
			sidebar: [
				{
					label: "Руководство",
					items: [{ label: "Введение", slug: "index" }],
				},
			],
			plugins: [
				starlightTypeDoc({
					entryPoints: ["../packages/di-craft/src/index.ts"],
					tsconfig: "../packages/di-craft/tsconfig.json",
					output: "api",
					sidebar: {
						label: "API Reference",
						collapsed: false,
					},
				}),
			],
		}),
	],
});

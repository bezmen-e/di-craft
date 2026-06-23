import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"next/client": "src/adapters/next/client.ts",
		"next/server": "src/adapters/next/server.ts",
	},
	format: ["esm"],
	dts: true,
	clean: true,
	treeshake: true,
	minify: true,
	sourcemap: false,
	target: "es2022",
});

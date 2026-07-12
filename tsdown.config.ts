import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"next/client": "src/adapters/next/client.ts",
		"next/server": "src/adapters/next/server.ts",
		node: "src/adapters/node/server.ts",
	},
	format: ["esm"],
	dts: true,
	tsconfig: "tsconfig/build.json",
	deps: {
		onlyBundle: [],
	},
	clean: true,
	treeshake: true,
	minify: false,
	sourcemap: true,
	target: "es2022",
});

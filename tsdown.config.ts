import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		index: "src/index.ts",
		"next/client": "src/adapters/next/client.ts",
		"next/server": "src/adapters/next/server.ts",
		node: "src/adapters/node/server.ts",
	},
	format: ["esm"],
	dts: {
		sourcemap: true,
	},
	tsconfig: "tsconfig/build.json",
	clean: true,
	treeshake: true,
	minify: false,
	sourcemap: true,
	target: "es2022",
	failOnWarn: true,
	publint: {
		strict: true,
	},
	attw: {
		profile: "esm-only",
		level: "error",
	},
});

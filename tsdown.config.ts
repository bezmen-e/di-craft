import { defineConfig } from "tsdown";

export default defineConfig({
	entry: {
		index: "src/index.ts",
	},
	format: ["esm"],
	dts: true,
	clean: true,
	treeshake: true,
	minify: false,
	sourcemap: false,
	target: "es2022",
});

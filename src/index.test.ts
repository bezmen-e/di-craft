import { describe, expect, test } from "bun:test";
import type {
	Container,
	DisposeHook,
	FactoryProvider,
	Provider,
	RegisterOptions,
	Scope,
	Token,
	ValueProvider,
} from "./index";
import * as publicApi from "./index";

// Compile-time guard: fails `typecheck` if any public type stops being exported.
// Types are erased at runtime, so they cannot be covered by the snapshot below.
type _PublicTypes =
	| Container
	| Token<unknown>
	| Provider
	| ValueProvider<unknown>
	| FactoryProvider<unknown>
	| Scope
	| RegisterOptions
	| DisposeHook<unknown>;

describe("public api", () => {
	test("exports exactly the documented runtime members", () => {
		const exported = Object.keys(publicApi).sort();

		expect(exported).toEqual(
			[
				"CircularDependencyError",
				"DiError",
				"DuplicateProviderError",
				"InvalidDependencyError",
				"MissingProviderError",
				"Scopes",
				"createContainer",
				"createToken",
				"provideFactory",
				"provideValue",
			].sort(),
		);
	});

	test("does not leak internal helpers", () => {
		expect(publicApi).not.toHaveProperty("createRegistry");
		expect(publicApi).not.toHaveProperty("createResolver");
		expect(publicApi).not.toHaveProperty("isValueProvider");
		expect(publicApi).not.toHaveProperty("isFactoryProvider");
	});
});

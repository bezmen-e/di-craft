import { describe, expect, test } from "bun:test";
import { provideFactory, provideValue } from "../provider";
import { createToken } from "../token";
import { createRegistry, DuplicateProviderError } from ".";

describe("registry", () => {
	test("registers and gets value provider by token", () => {
		const TOKEN = createToken<string>("TOKEN");
		const provider = provideValue(TOKEN, "value");

		const registry = createRegistry();

		registry.register(provider);

		expect(registry.get(TOKEN)).toBe(provider);
	});

	test("registers and gets factory provider by token", () => {
		const TOKEN = createToken<string>("TOKEN");
		const provider = provideFactory(TOKEN, {
			useFactory: () => "value",
		});

		const registry = createRegistry();

		registry.register(provider);

		expect(registry.get(TOKEN)).toBe(provider);
	});

	test("returns undefined for missing provider", () => {
		const TOKEN = createToken<string>("TOKEN");

		const registry = createRegistry();

		expect(registry.get(TOKEN)).toBeUndefined();
	});

	test("checks if provider exists", () => {
		const TOKEN = createToken<string>("TOKEN");
		const provider = provideValue(TOKEN, "value");

		const registry = createRegistry();

		expect(registry.has(TOKEN)).toBe(false);

		registry.register(provider);

		expect(registry.has(TOKEN)).toBe(true);
	});

	test("throws DuplicateProviderError on duplicate provider registration", () => {
		const TOKEN = createToken<string>("TOKEN");

		const firstProvider = provideValue(TOKEN, "first");
		const secondProvider = provideValue(TOKEN, "second");

		const registry = createRegistry();

		registry.register(firstProvider);

		expect(() => registry.register(secondProvider)).toThrow(
			DuplicateProviderError,
		);

		expect(() => registry.register(secondProvider)).toThrow(
			'Provider for token "TOKEN" is already registered',
		);
	});

	test("does not treat tokens with same name as duplicates", () => {
		const FIRST_TOKEN = createToken<string>("TOKEN");
		const SECOND_TOKEN = createToken<string>("TOKEN");

		const firstProvider = provideValue(FIRST_TOKEN, "first");
		const secondProvider = provideValue(SECOND_TOKEN, "second");

		const registry = createRegistry();

		registry.register(firstProvider);
		registry.register(secondProvider);

		expect(registry.get(FIRST_TOKEN)).toBe(firstProvider);
		expect(registry.get(SECOND_TOKEN)).toBe(secondProvider);
	});
});

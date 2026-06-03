import { describe, expect, test } from "bun:test";
import type { Provider } from "../provider";
import { provideFactory, provideValue } from "../provider";
import { createRegistry } from "../registry";
import { createToken } from "../token";
import {
	createResolver,
	InvalidDependencyError,
	MissingProviderError,
} from ".";

describe("resolver", () => {
	test("resolves value provider", () => {
		const TOKEN = createToken<string>("TOKEN");

		const registry = createRegistry();
		registry.register(provideValue(TOKEN, "value"));

		const resolver = createResolver(registry);

		expect(resolver.resolve(TOKEN)).toBe("value");
	});

	test("resolves factory provider without deps", () => {
		const TOKEN = createToken<string>("TOKEN");

		const registry = createRegistry();
		registry.register(
			provideFactory(TOKEN, {
				useFactory: () => "value",
			}),
		);

		const resolver = createResolver(registry);

		expect(resolver.resolve(TOKEN)).toBe("value");
	});

	test("resolves factory provider with deps", () => {
		const COUNTER = createToken<{ value: number }>("counter");
		const MULTIPLIER = createToken<{ value: number }>("multiplier");

		const registry = createRegistry();

		registry.register(provideValue(COUNTER, { value: 2 }));

		registry.register(
			provideFactory(MULTIPLIER, {
				deps: {
					counter: COUNTER,
				},
				useFactory: ({ counter }) => ({
					value: counter.value * 2,
				}),
			}),
		);

		const resolver = createResolver(registry);

		expect(resolver.resolve(MULTIPLIER)).toEqual({
			value: 4,
		});
	});

	test("resolves nested factory deps", () => {
		const A = createToken<number>("A");
		const B = createToken<number>("B");
		const C = createToken<number>("C");

		const registry = createRegistry();

		registry.register(provideValue(A, 1));

		registry.register(
			provideFactory(B, {
				deps: {
					a: A,
				},
				useFactory: ({ a }) => a + 1,
			}),
		);

		registry.register(
			provideFactory(C, {
				deps: {
					b: B,
				},
				useFactory: ({ b }) => b + 1,
			}),
		);

		const resolver = createResolver(registry);

		expect(resolver.resolve(C)).toBe(3);
	});

	test("throws MissingProviderError when provider is not registered", () => {
		const TOKEN = createToken<string>("TOKEN");

		const registry = createRegistry();
		const resolver = createResolver(registry);

		expect(() => resolver.resolve(TOKEN)).toThrow(MissingProviderError);

		expect(() => resolver.resolve(TOKEN)).toThrow(
			'Provider for token "TOKEN" is not registered',
		);
	});

	test("throws MissingProviderError when dependency provider is not registered", () => {
		const MISSING = createToken<number>("MISSING");
		const TOKEN = createToken<number>("TOKEN");

		const registry = createRegistry();

		registry.register(
			provideFactory(TOKEN, {
				deps: {
					missing: MISSING,
				},
				useFactory: ({ missing }) => missing + 1,
			}),
		);

		const resolver = createResolver(registry);

		expect(() => resolver.resolve(TOKEN)).toThrow(MissingProviderError);

		expect(() => resolver.resolve(TOKEN)).toThrow(
			'Provider for token "MISSING" is not registered',
		);
	});

	test("throws InvalidDependencyError when dependency token is undefined", () => {
		const TOKEN = createToken<number>("TOKEN");

		const registry = createRegistry();

		const invalidProvider = {
			provide: TOKEN,
			deps: {
				invalid: undefined,
			},
			useFactory: () => 1,
		} as unknown as Provider;

		registry.register(invalidProvider);

		const resolver = createResolver(registry);

		expect(() => resolver.resolve(TOKEN)).toThrow(InvalidDependencyError);

		expect(() => resolver.resolve(TOKEN)).toThrow(
			'Invalid dependency "invalid"',
		);
	});
});

import { describe, expect, test } from "bun:test";
import { provideFactory, provideValue } from "../provider";
import { DuplicateProviderError } from "../registry";
import { CircularDependencyError, MissingProviderError } from "../resolver";
import { createToken } from "../token";
import { createContainer } from ".";

describe("container", () => {
	test("creates container with initial providers", () => {
		const TOKEN = createToken<string>("TOKEN");

		const container = createContainer([provideValue(TOKEN, "value")]);

		expect(container.get(TOKEN)).toBe("value");
	});

	test("registers provider after creation", () => {
		const TOKEN = createToken<string>("TOKEN");

		const container = createContainer();

		expect(container.has(TOKEN)).toBe(false);

		container.register(provideValue(TOKEN, "value"));

		expect(container.has(TOKEN)).toBe(true);
		expect(container.get(TOKEN)).toBe("value");
	});

	test("resolves factory provider with deps", () => {
		const COUNTER = createToken<{ value: number }>("counter");
		const MULTIPLIER = createToken<{ value: number }>("multiplier");

		const container = createContainer([
			provideValue(COUNTER, { value: 2 }),

			provideFactory(MULTIPLIER, {
				deps: {
					counter: COUNTER,
				},
				useFactory: ({ counter }) => ({
					value: counter.value * 2,
				}),
			}),
		]);

		expect(container.get(MULTIPLIER)).toEqual({
			value: 4,
		});
	});

	test("throws MissingProviderError for missing provider", () => {
		const TOKEN = createToken<string>("TOKEN");

		const container = createContainer();

		expect(() => container.get(TOKEN)).toThrow(MissingProviderError);

		expect(() => container.get(TOKEN)).toThrow(
			'Provider for token "TOKEN" is not registered',
		);
	});

	test("throws DuplicateProviderError on duplicate registration", () => {
		const TOKEN = createToken<string>("TOKEN");

		const container = createContainer([provideValue(TOKEN, "first")]);

		expect(() => {
			container.register(provideValue(TOKEN, "second"));
		}).toThrow(DuplicateProviderError);

		expect(() => {
			container.register(provideValue(TOKEN, "second"));
		}).toThrow('Provider for token "TOKEN" is already registered');
	});

	test("caches singleton factory provider", () => {
		const TOKEN = createToken<{ value: number }>("TOKEN");

		let calls = 0;

		const container = createContainer([
			provideFactory(TOKEN, {
				useFactory: () => {
					calls += 1;

					return { value: calls };
				},
			}),
		]);

		const first = container.get(TOKEN);
		const second = container.get(TOKEN);

		expect(first).toBe(second);
		expect(first.value).toBe(1);
		expect(second.value).toBe(1);
		expect(calls).toBe(1);
	});

	test("does not cache transient factory provider", () => {
		const TOKEN = createToken<{ value: number }>("TOKEN");

		let calls = 0;

		const container = createContainer([
			provideFactory(TOKEN, {
				scope: "transient",
				useFactory: () => {
					calls += 1;

					return { value: calls };
				},
			}),
		]);

		const first = container.get(TOKEN);
		const second = container.get(TOKEN);

		expect(first).not.toBe(second);
		expect(first.value).toBe(1);
		expect(second.value).toBe(2);
		expect(calls).toBe(2);
	});

	test("throws CircularDependencyError for circular deps", () => {
		const A = createToken<number>("A");
		const B = createToken<number>("B");

		const container = createContainer([
			provideFactory(A, {
				deps: {
					b: B,
				},
				useFactory: ({ b }) => b + 1,
			}),

			provideFactory(B, {
				deps: {
					a: A,
				},
				useFactory: ({ a }) => a + 1,
			}),
		]);

		expect(() => container.get(A)).toThrow(CircularDependencyError);

		expect(() => container.get(A)).toThrow(
			"Circular dependency detected: A -> B -> A",
		);
	});
});

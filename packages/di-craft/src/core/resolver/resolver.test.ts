import { describe, expect, test } from "bun:test";
import type { Provider } from "../provider";
import {
	InvalidProviderError,
	optional,
	provideFactory,
	provideValue,
} from "../provider";
import { createRegistry } from "../registry";
import { createToken } from "../token";
import {
	CircularDependencyError,
	InvalidDependencyError,
	MissingProviderError,
} from "./errors";
import { createResolver } from "./resolver";

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

	test("caches factory provider by default", () => {
		const TOKEN = createToken<{ value: number }>("TOKEN");

		let calls = 0;

		const registry = createRegistry();

		registry.register(
			provideFactory(TOKEN, {
				useFactory: () => {
					calls += 1;

					return { value: calls };
				},
			}),
		);

		const resolver = createResolver(registry);

		const first = resolver.resolve(TOKEN);
		const second = resolver.resolve(TOKEN);

		expect(first).toBe(second);
		expect(first.value).toBe(1);
		expect(second.value).toBe(1);
		expect(calls).toBe(1);
	});

	test("caches singleton factory provider", () => {
		const TOKEN = createToken<{ value: number }>("TOKEN");

		let calls = 0;

		const registry = createRegistry();

		registry.register(
			provideFactory(TOKEN, {
				scope: "singleton",
				useFactory: () => {
					calls += 1;

					return { value: calls };
				},
			}),
		);

		const resolver = createResolver(registry);

		const first = resolver.resolve(TOKEN);
		const second = resolver.resolve(TOKEN);

		expect(first).toBe(second);
		expect(first.value).toBe(1);
		expect(second.value).toBe(1);
		expect(calls).toBe(1);
	});

	test("does not cache transient factory provider", () => {
		const TOKEN = createToken<{ value: number }>("TOKEN");

		let calls = 0;

		const registry = createRegistry();

		registry.register(
			provideFactory(TOKEN, {
				scope: "transient",
				useFactory: () => {
					calls += 1;

					return { value: calls };
				},
			}),
		);

		const resolver = createResolver(registry);

		const first = resolver.resolve(TOKEN);
		const second = resolver.resolve(TOKEN);

		expect(first).not.toBe(second);
		expect(first.value).toBe(1);
		expect(second.value).toBe(2);
		expect(calls).toBe(2);
	});

	test("caches scoped factory provider within the resolver", () => {
		const TOKEN = createToken<{ value: number }>("TOKEN");

		let calls = 0;

		const registry = createRegistry();

		registry.register(
			provideFactory(TOKEN, {
				scope: "scoped",
				useFactory: () => {
					calls += 1;

					return { value: calls };
				},
			}),
		);

		const resolver = createResolver(registry);

		const first = resolver.resolve(TOKEN);
		const second = resolver.resolve(TOKEN);

		expect(first).toBe(second);
		expect(calls).toBe(1);
	});

	test("reuses singleton dependency for transient provider", () => {
		const DEP = createToken<{ value: number }>("DEP");
		const SERVICE = createToken<{ dep: { value: number } }>("SERVICE");

		let depCalls = 0;

		const registry = createRegistry();

		registry.register(
			provideFactory(DEP, {
				useFactory: () => {
					depCalls += 1;

					return { value: depCalls };
				},
			}),
		);

		registry.register(
			provideFactory(SERVICE, {
				scope: "transient",
				deps: {
					dep: DEP,
				},
				useFactory: ({ dep }) => ({
					dep,
				}),
			}),
		);

		const resolver = createResolver(registry);

		const first = resolver.resolve(SERVICE);
		const second = resolver.resolve(SERVICE);

		expect(first).not.toBe(second);
		expect(first.dep).toBe(second.dep);
		expect(depCalls).toBe(1);
	});

	test("recreates transient dependency when resolving transient provider", () => {
		const DEP = createToken<{ value: number }>("DEP");
		const SERVICE = createToken<{ dep: { value: number } }>("SERVICE");

		let depCalls = 0;

		const registry = createRegistry();

		registry.register(
			provideFactory(DEP, {
				scope: "transient",
				useFactory: () => {
					depCalls += 1;

					return { value: depCalls };
				},
			}),
		);

		registry.register(
			provideFactory(SERVICE, {
				scope: "transient",
				deps: {
					dep: DEP,
				},
				useFactory: ({ dep }) => ({
					dep,
				}),
			}),
		);

		const resolver = createResolver(registry);

		const first = resolver.resolve(SERVICE);
		const second = resolver.resolve(SERVICE);

		expect(first).not.toBe(second);
		expect(first.dep).not.toBe(second.dep);
		expect(first.dep.value).toBe(1);
		expect(second.dep.value).toBe(2);
		expect(depCalls).toBe(2);
	});

	test("throws CircularDependencyError for direct cycle", () => {
		const A = createToken<number>("A");

		const registry = createRegistry();

		registry.register(
			provideFactory(A, {
				deps: {
					a: A,
				},
				useFactory: ({ a }) => a + 1,
			}),
		);

		const resolver = createResolver(registry);

		expect(() => resolver.resolve(A)).toThrow(CircularDependencyError);

		expect(() => resolver.resolve(A)).toThrow(
			"Circular dependency detected: A -> A",
		);
	});

	test("throws CircularDependencyError for nested cycle", () => {
		const A = createToken<number>("A");
		const B = createToken<number>("B");
		const C = createToken<number>("C");

		const registry = createRegistry();

		registry.register(
			provideFactory(A, {
				deps: {
					b: B,
				},
				useFactory: ({ b }) => b + 1,
			}),
		);

		registry.register(
			provideFactory(B, {
				deps: {
					c: C,
				},
				useFactory: ({ c }) => c + 1,
			}),
		);

		registry.register(
			provideFactory(C, {
				deps: {
					a: A,
				},
				useFactory: ({ a }) => a + 1,
			}),
		);

		const resolver = createResolver(registry);

		expect(() => resolver.resolve(A)).toThrow(CircularDependencyError);

		expect(() => resolver.resolve(A)).toThrow(
			"Circular dependency detected: A -> B -> C -> A",
		);
	});

	test("does not throw CircularDependencyError for reused singleton after resolved", () => {
		const A = createToken<{ value: number }>("A");
		const B = createToken<{ a: { value: number } }>("B");
		const C = createToken<{
			a: { value: number };
			b: { a: { value: number } };
		}>("C");

		const registry = createRegistry();

		registry.register(
			provideFactory(A, {
				useFactory: () => ({
					value: 1,
				}),
			}),
		);

		registry.register(
			provideFactory(B, {
				deps: {
					a: A,
				},
				useFactory: ({ a }) => ({
					a,
				}),
			}),
		);

		registry.register(
			provideFactory(C, {
				deps: {
					a: A,
					b: B,
				},
				useFactory: ({ a, b }) => ({
					a,
					b,
				}),
			}),
		);

		const resolver = createResolver(registry);

		const value = resolver.resolve(C);

		expect(value.a).toBe(value.b.a);
	});

	test("resolves an optional dependency to undefined when its provider is missing", () => {
		const LOGGER = createToken<{ log: () => void }>("LOGGER");
		const SERVICE = createToken<{ hasLogger: boolean }>("SERVICE");

		const registry = createRegistry();

		registry.register(
			provideFactory(SERVICE, {
				deps: { logger: optional(LOGGER) },
				useFactory: ({ logger }) => ({ hasLogger: logger !== undefined }),
			}),
		);

		const resolver = createResolver(registry);

		expect(resolver.resolve(SERVICE)).toEqual({ hasLogger: false });
	});

	test("resolves an optional dependency normally when its provider exists", () => {
		const LOGGER = createToken<{ tag: string }>("LOGGER");
		const SERVICE = createToken<{ tag: string | undefined }>("SERVICE");

		const registry = createRegistry();

		registry.register(provideValue(LOGGER, { tag: "real" }));
		registry.register(
			provideFactory(SERVICE, {
				deps: { logger: optional(LOGGER) },
				useFactory: ({ logger }) => ({ tag: logger?.tag }),
			}),
		);

		const resolver = createResolver(registry);

		expect(resolver.resolve(SERVICE)).toEqual({ tag: "real" });
	});

	test("optional does not swallow errors from a present provider", () => {
		const MISSING = createToken<number>("MISSING");
		const FLAKY = createToken<number>("FLAKY");
		const SERVICE = createToken<number>("SERVICE");

		const registry = createRegistry();

		registry.register(
			provideFactory(FLAKY, {
				deps: { missing: MISSING },
				useFactory: ({ missing }) => missing + 1,
			}),
		);
		registry.register(
			provideFactory(SERVICE, {
				deps: { flaky: optional(FLAKY) },
				useFactory: ({ flaky }) => flaky ?? 0,
			}),
		);

		const resolver = createResolver(registry);

		expect(() => resolver.resolve(SERVICE)).toThrow(MissingProviderError);
	});

	test("hasDisposableInstance reflects a cached instance with onDispose", () => {
		const PLAIN = createToken<string>("PLAIN");
		const DISPOSABLE = createToken<string>("DISPOSABLE");

		const registry = createRegistry();

		registry.register(provideFactory(PLAIN, { useFactory: () => "plain" }));
		registry.register(
			provideFactory(DISPOSABLE, {
				useFactory: () => "disposable",
				onDispose: () => {},
			}),
		);

		const resolver = createResolver(registry);

		expect(resolver.hasDisposableInstance(DISPOSABLE)).toBe(false);

		resolver.resolve(PLAIN);
		resolver.resolve(DISPOSABLE);

		expect(resolver.hasDisposableInstance(PLAIN)).toBe(false);
		expect(resolver.hasDisposableInstance(DISPOSABLE)).toBe(true);
	});

	test("throws when a singleton depends on a scoped provider", () => {
		const SCOPED = createToken<number>("SCOPED");
		const SINGLETON = createToken<number>("SINGLETON");

		const registry = createRegistry();

		registry.register(
			provideFactory(SCOPED, { scope: "scoped", useFactory: () => 1 }),
		);
		registry.register(
			provideFactory(SINGLETON, {
				deps: { scoped: SCOPED },
				useFactory: ({ scoped }) => scoped + 1,
			}),
		);

		const resolver = createResolver(registry);

		expect(() => resolver.resolve(SINGLETON)).toThrow(InvalidProviderError);
		expect(() => resolver.resolve(SINGLETON)).toThrow(
			'"SINGLETON" (singleton) cannot depend on "SCOPED" (scoped)',
		);
	});

	test("throws when a singleton depends on a transient provider", () => {
		const TRANSIENT = createToken<number>("TRANSIENT");
		const SINGLETON = createToken<number>("SINGLETON");

		const registry = createRegistry();

		registry.register(
			provideFactory(TRANSIENT, { scope: "transient", useFactory: () => 1 }),
		);
		registry.register(
			provideFactory(SINGLETON, {
				deps: { transient: TRANSIENT },
				useFactory: ({ transient }) => transient + 1,
			}),
		);

		const resolver = createResolver(registry);

		expect(() => resolver.resolve(SINGLETON)).toThrow(InvalidProviderError);
	});

	test("throws when a scoped provider depends on a transient provider", () => {
		const TRANSIENT = createToken<number>("TRANSIENT");
		const SCOPED = createToken<number>("SCOPED");

		const registry = createRegistry();

		registry.register(
			provideFactory(TRANSIENT, { scope: "transient", useFactory: () => 1 }),
		);
		registry.register(
			provideFactory(SCOPED, {
				scope: "scoped",
				deps: { transient: TRANSIENT },
				useFactory: ({ transient }) => transient + 1,
			}),
		);

		const resolver = createResolver(registry);

		expect(() => resolver.resolve(SCOPED)).toThrow(InvalidProviderError);
	});

	test("throws for an optional shorter-lived dependency", () => {
		const SCOPED = createToken<number>("SCOPED");
		const SINGLETON = createToken<number>("SINGLETON");

		const registry = createRegistry();

		registry.register(
			provideFactory(SCOPED, { scope: "scoped", useFactory: () => 1 }),
		);
		registry.register(
			provideFactory(SINGLETON, {
				deps: { scoped: optional(SCOPED) },
				useFactory: ({ scoped }) => (scoped ?? 0) + 1,
			}),
		);

		const resolver = createResolver(registry);

		expect(() => resolver.resolve(SINGLETON)).toThrow(InvalidProviderError);
	});

	test("allows depending on a longer-lived provider", () => {
		const SINGLETON = createToken<number>("SINGLETON");
		const SCOPED = createToken<number>("SCOPED");
		const TRANSIENT = createToken<number>("TRANSIENT");

		const registry = createRegistry();

		registry.register(provideFactory(SINGLETON, { useFactory: () => 1 }));
		registry.register(
			provideFactory(SCOPED, {
				scope: "scoped",
				deps: { singleton: SINGLETON },
				useFactory: ({ singleton }) => singleton + 1,
			}),
		);
		registry.register(
			provideFactory(TRANSIENT, {
				scope: "transient",
				deps: { singleton: SINGLETON, scoped: SCOPED },
				useFactory: ({ singleton, scoped }) => singleton + scoped,
			}),
		);

		const resolver = createResolver(registry);

		expect(resolver.resolve(SCOPED)).toBe(2);
		expect(resolver.resolve(TRANSIENT)).toBe(3);
	});

	test("allows depending on a value regardless of scope", () => {
		const VALUE = createToken<number>("VALUE");
		const SINGLETON = createToken<number>("SINGLETON");

		const registry = createRegistry();

		registry.register(provideValue(VALUE, 1));
		registry.register(
			provideFactory(SINGLETON, {
				deps: { value: VALUE },
				useFactory: ({ value }) => value + 1,
			}),
		);

		const resolver = createResolver(registry);

		expect(resolver.resolve(SINGLETON)).toBe(2);
	});

	test("invalidate clears the cached singleton instance", () => {
		const TOKEN = createToken<{ value: number }>("TOKEN");

		let calls = 0;

		const registry = createRegistry();

		registry.register(
			provideFactory(TOKEN, {
				useFactory: () => {
					calls += 1;

					return { value: calls };
				},
			}),
		);

		const resolver = createResolver(registry);

		const first = resolver.resolve(TOKEN);

		resolver.invalidate(TOKEN);

		const second = resolver.resolve(TOKEN);

		expect(first).not.toBe(second);
		expect(first.value).toBe(1);
		expect(second.value).toBe(2);
		expect(calls).toBe(2);
	});
});

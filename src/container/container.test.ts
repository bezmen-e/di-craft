import { describe, expect, test } from "bun:test";
import { provideFactory, provideValue } from "../provider";
import { DuplicateProviderError } from "../registry";
import { CircularDependencyError, MissingProviderError } from "../resolver";
import { createToken } from "../token";
import { createChildContainer, createContainer } from ".";

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

	test("overrides an existing provider with override option", () => {
		const TOKEN = createToken<string>("TOKEN");

		const container = createContainer([provideValue(TOKEN, "first")]);

		container.register(provideValue(TOKEN, "second"), { allowOverride: true });

		expect(container.get(TOKEN)).toBe("second");
	});

	test("override invalidates an already resolved singleton", () => {
		const TOKEN = createToken<{ value: string }>("TOKEN");

		const container = createContainer([
			provideFactory(TOKEN, {
				useFactory: () => ({ value: "first" }),
			}),
		]);

		const first = container.get(TOKEN);

		container.register(
			provideFactory(TOKEN, {
				useFactory: () => ({ value: "second" }),
			}),
			{ allowOverride: true },
		);

		const second = container.get(TOKEN);

		expect(first.value).toBe("first");
		expect(second.value).toBe("second");
		expect(first).not.toBe(second);
	});

	test("override on a missing token registers it", () => {
		const TOKEN = createToken<string>("TOKEN");

		const container = createContainer();

		container.register(provideValue(TOKEN, "value"), { allowOverride: true });

		expect(container.get(TOKEN)).toBe("value");
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

	test("dispose calls onDispose for resolved singletons", async () => {
		const TOKEN = createToken<{ closed: boolean }>("TOKEN");

		const instance = { closed: false };

		const container = createContainer([
			provideFactory(TOKEN, {
				useFactory: () => instance,
				onDispose: (value) => {
					value.closed = true;
				},
			}),
		]);

		container.get(TOKEN);

		await container.dispose();

		expect(instance.closed).toBe(true);
	});

	test("dispose runs hooks in reverse creation order", async () => {
		const DEP = createToken<string>("DEP");
		const SERVICE = createToken<string>("SERVICE");

		const order: string[] = [];

		const container = createContainer([
			provideFactory(DEP, {
				useFactory: () => "dep",
				onDispose: () => {
					order.push("dep");
				},
			}),
			provideFactory(SERVICE, {
				deps: { dep: DEP },
				useFactory: () => "service",
				onDispose: () => {
					order.push("service");
				},
			}),
		]);

		container.get(SERVICE);

		await container.dispose();

		expect(order).toEqual(["service", "dep"]);
	});

	test("dispose awaits async onDispose hooks", async () => {
		const TOKEN = createToken<{ closed: boolean }>("TOKEN");

		const instance = { closed: false };

		const container = createContainer([
			provideFactory(TOKEN, {
				useFactory: () => instance,
				onDispose: async (value) => {
					await Promise.resolve();

					value.closed = true;
				},
			}),
		]);

		container.get(TOKEN);

		await container.dispose();

		expect(instance.closed).toBe(true);
	});

	test("dispose is idempotent", async () => {
		const TOKEN = createToken<string>("TOKEN");

		let calls = 0;

		const container = createContainer([
			provideFactory(TOKEN, {
				useFactory: () => "value",
				onDispose: () => {
					calls += 1;
				},
			}),
		]);

		container.get(TOKEN);

		await container.dispose();
		await container.dispose();

		expect(calls).toBe(1);
	});

	test("dispose does nothing for providers without onDispose", async () => {
		const TOKEN = createToken<string>("TOKEN");

		const container = createContainer([
			provideFactory(TOKEN, {
				useFactory: () => "value",
			}),
		]);

		container.get(TOKEN);

		await expect(container.dispose()).resolves.toBeUndefined();
	});

	test("dispose ignores unresolved and transient instances", async () => {
		const SINGLETON = createToken<string>("SINGLETON");
		const UNUSED = createToken<string>("UNUSED");
		const TRANSIENT = createToken<string>("TRANSIENT");

		const disposed: string[] = [];

		const container = createContainer([
			provideFactory(SINGLETON, {
				useFactory: () => "singleton",
				onDispose: () => {
					disposed.push("singleton");
				},
			}),
			provideFactory(UNUSED, {
				useFactory: () => "unused",
				onDispose: () => {
					disposed.push("unused");
				},
			}),
			provideFactory(TRANSIENT, {
				scope: "transient",
				useFactory: () => "transient",
				onDispose: () => {
					disposed.push("transient");
				},
			}),
		]);

		container.get(SINGLETON);
		container.get(TRANSIENT);

		await container.dispose();

		expect(disposed).toEqual(["singleton"]);
	});

	test("child resolves providers inherited from the parent", () => {
		const TOKEN = createToken<string>("TOKEN");

		const root = createContainer([provideValue(TOKEN, "value")]);
		const child = createChildContainer(root);

		expect(child.get(TOKEN)).toBe("value");
	});

	test("singleton from the parent is shared across children", () => {
		const TOKEN = createToken<{ value: number }>("TOKEN");

		let calls = 0;

		const root = createContainer([
			provideFactory(TOKEN, {
				useFactory: () => {
					calls += 1;

					return { value: calls };
				},
			}),
		]);

		const childA = createChildContainer(root);
		const childB = createChildContainer(root);

		const fromA = childA.get(TOKEN);
		const fromB = childB.get(TOKEN);
		const fromRoot = root.get(TOKEN);

		expect(fromA).toBe(fromB);
		expect(fromA).toBe(fromRoot);
		expect(calls).toBe(1);
	});

	test("scoped provider yields one instance per child", () => {
		const TOKEN = createToken<{ value: number }>("TOKEN");

		let calls = 0;

		const root = createContainer([
			provideFactory(TOKEN, {
				scope: "scoped",
				useFactory: () => {
					calls += 1;

					return { value: calls };
				},
			}),
		]);

		const childA = createChildContainer(root);
		const childB = createChildContainer(root);

		const firstFromA = childA.get(TOKEN);
		const secondFromA = childA.get(TOKEN);
		const fromB = childB.get(TOKEN);

		expect(firstFromA).toBe(secondFromA);
		expect(firstFromA).not.toBe(fromB);
		expect(calls).toBe(2);
	});

	test("scoped provider from the root sees child-registered dependencies", () => {
		const REQUEST = createToken<{ id: number }>("REQUEST");
		const HANDLER = createToken<{ requestId: number }>("HANDLER");

		const root = createContainer([
			provideFactory(HANDLER, {
				scope: "scoped",
				deps: { request: REQUEST },
				useFactory: ({ request }) => ({ requestId: request.id }),
			}),
		]);

		const child = createChildContainer(root, [
			provideValue(REQUEST, { id: 42 }),
		]);

		expect(child.get(HANDLER).requestId).toBe(42);
	});

	test("child override does not affect the parent", () => {
		const TOKEN = createToken<string>("TOKEN");

		const root = createContainer([provideValue(TOKEN, "root")]);
		const child = createChildContainer(root, [provideValue(TOKEN, "child")]);

		expect(child.get(TOKEN)).toBe("child");
		expect(root.get(TOKEN)).toBe("root");
	});

	test("disposing a child leaves the parent intact", async () => {
		const PARENT_TOKEN = createToken<string>("PARENT_TOKEN");
		const CHILD_TOKEN = createToken<string>("CHILD_TOKEN");

		const disposed: string[] = [];

		const root = createContainer([
			provideFactory(PARENT_TOKEN, {
				useFactory: () => "parent",
				onDispose: () => {
					disposed.push("parent");
				},
			}),
		]);

		const child = createChildContainer(root, [
			provideFactory(CHILD_TOKEN, {
				useFactory: () => "child",
				onDispose: () => {
					disposed.push("child");
				},
			}),
		]);

		child.get(CHILD_TOKEN);
		root.get(PARENT_TOKEN);

		await child.dispose();

		expect(disposed).toEqual(["child"]);

		await root.dispose();

		expect(disposed).toEqual(["child", "parent"]);
	});

	test("has walks the parent chain", () => {
		const TOKEN = createToken<string>("TOKEN");

		const root = createContainer([provideValue(TOKEN, "value")]);
		const child = createChildContainer(root);

		expect(child.has(TOKEN)).toBe(true);
		expect(root.has(TOKEN)).toBe(true);
	});

	test("throws MissingProviderError when no container in the chain has the token", () => {
		const TOKEN = createToken<string>("TOKEN");

		const root = createContainer();
		const child = createChildContainer(root);

		expect(() => child.get(TOKEN)).toThrow(MissingProviderError);
	});

	test("detects circular dependencies when resolving from a child", () => {
		const A = createToken<number>("A");
		const B = createToken<number>("B");

		const root = createContainer([
			provideFactory(A, {
				deps: { b: B },
				useFactory: ({ b }) => b + 1,
			}),
			provideFactory(B, {
				deps: { a: A },
				useFactory: ({ a }) => a + 1,
			}),
		]);

		const child = createChildContainer(root);

		expect(() => child.get(A)).toThrow(CircularDependencyError);
	});
});

import { describe, expect, test } from "bun:test";
import { createToken } from "../token";
import { createStore } from "./store";

describe("store", () => {
	test("sets and gets an instance record", () => {
		const TOKEN = createToken<string>("TOKEN");
		const store = createStore();

		store.set(TOKEN, { value: "value" });

		expect(store.get(TOKEN)?.value).toBe("value");
	});

	test("returns undefined for an unknown token", () => {
		const TOKEN = createToken<string>("TOKEN");
		const store = createStore();

		expect(store.get(TOKEN)).toBeUndefined();
	});

	test("deletes a record", () => {
		const TOKEN = createToken<string>("TOKEN");
		const store = createStore();

		store.set(TOKEN, { value: "value" });
		store.delete(TOKEN);

		expect(store.get(TOKEN)).toBeUndefined();
	});

	test("dispose runs hooks in reverse insertion order", async () => {
		const FIRST = createToken<string>("FIRST");
		const SECOND = createToken<string>("SECOND");

		const order: string[] = [];
		const store = createStore();

		store.set(FIRST, {
			value: "first",
			onDispose: () => {
				order.push("first");
			},
		});
		store.set(SECOND, {
			value: "second",
			onDispose: () => {
				order.push("second");
			},
		});

		await store.dispose();

		expect(order).toEqual(["second", "first"]);
	});

	test("dispose awaits async hooks", async () => {
		const TOKEN = createToken<{ closed: boolean }>("TOKEN");
		const instance = { closed: false };
		const store = createStore();

		store.set(TOKEN, {
			value: instance,
			onDispose: async (value) => {
				await Promise.resolve();
				(value as { closed: boolean }).closed = true;
			},
		});

		await store.dispose();

		expect(instance.closed).toBe(true);
	});

	test("dispose is idempotent and clears the store", async () => {
		const TOKEN = createToken<string>("TOKEN");

		let calls = 0;
		const store = createStore();

		store.set(TOKEN, {
			value: "value",
			onDispose: () => {
				calls += 1;
			},
		});

		await store.dispose();
		await store.dispose();

		expect(calls).toBe(1);
		expect(store.get(TOKEN)).toBeUndefined();
	});

	test("dispose ignores records without a hook", async () => {
		const TOKEN = createToken<string>("TOKEN");
		const store = createStore();

		store.set(TOKEN, { value: "value" });

		await expect(store.dispose()).resolves.toBeUndefined();
	});
});

import { describe, expect, it } from "bun:test";
import { createToken } from "./token";

describe("createToken", () => {
	it("creates token with provided name", () => {
		const counter = createToken<{ value: number }>("counter");

		expect(counter.name).toBe("counter");
	});

	it("creates token with symbol id", () => {
		const counter = createToken<{ value: number }>("counter");

		expect(typeof counter.id).toBe("symbol");
	});

	it("creates unique id for every token", () => {
		const firstCounter = createToken<{ value: number }>("counter");
		const secondCounter = createToken<{ value: number }>("counter");

		expect(firstCounter.id).not.toBe(secondCounter.id);
	});

	it("does not use token name as identity", () => {
		const firstToken = createToken<string>("same-name");
		const secondToken = createToken<string>("same-name");

		expect(firstToken.name).toBe(secondToken.name);
		expect(firstToken.id).not.toBe(secondToken.id);
	});

	it("does not create __type field at runtime", () => {
		const counter = createToken<{ value: number }>("counter");

		expect("__type" in counter).toBe(false);
	});
});

import { describe, expect, test } from "bun:test";
import { createToken } from "../token";
import { provideFactory, provideValue } from "./helpers";
import { isFactoryProvider, isValueProvider } from "./provider";

describe("provider", () => {
	test("creates value provider", () => {
		const TOKEN = createToken<string>("TOKEN");

		const provider = provideValue(TOKEN, "value");

		expect(provider).toEqual({
			provide: TOKEN,
			useValue: "value",
		});
	});

	test("creates factory provider", () => {
		const TOKEN = createToken<string>("TOKEN");
		const useFactory = () => "value";

		const provider = provideFactory(TOKEN, useFactory);

		expect(provider).toEqual({
			provide: TOKEN,
			useFactory,
		});
	});

	test("detects value provider", () => {
		const TOKEN = createToken<string>("TOKEN");

		const provider = provideValue(TOKEN, "value");

		expect(isValueProvider(provider)).toBe(true);
		expect(isFactoryProvider(provider)).toBe(false);
	});

	test("detects factory provider", () => {
		const TOKEN = createToken<string>("TOKEN");

		const provider = provideFactory(TOKEN, () => "value");

		expect(isFactoryProvider(provider)).toBe(true);
		expect(isValueProvider(provider)).toBe(false);
	});

	test("value provider is typed by token", () => {
		const TOKEN = createToken<string>("TOKEN");

		provideValue(TOKEN, "value");

		// @ts-expect-error number is not assignable to string
		provideValue(TOKEN, 123);
	});

	test("factory provider is typed by token", () => {
		const TOKEN = createToken<string>("TOKEN");

		provideFactory(TOKEN, () => "value");

		// @ts-expect-error number is not assignable to string
		provideFactory(TOKEN, () => 123);
	});
});

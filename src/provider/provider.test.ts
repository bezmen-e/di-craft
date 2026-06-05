import { describe, expect, test } from "bun:test";
import { createToken } from "../token";
import {
	isFactoryProvider,
	isValueProvider,
	provideFactory,
	provideValue,
} from ".";

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
		const createValue = () => "value";

		const provider = provideFactory(TOKEN, {
			useFactory: createValue,
		});

		expect(provider).toEqual({
			provide: TOKEN,
			useFactory: createValue,
			scope: "singleton",
		});
	});

	test("creates factory provider with deps", () => {
		const COUNTER = createToken<{ value: number }>("counter");
		const MULTIPLIER = createToken<{ value: number }>("multiplier");

		const createMultiplier = ({ counter }: { counter: { value: number } }) => ({
			value: counter.value * 2,
		});

		const provider = provideFactory(MULTIPLIER, {
			deps: {
				counter: COUNTER,
			},
			useFactory: createMultiplier,
		});

		expect(provider).toEqual({
			provide: MULTIPLIER,
			deps: {
				counter: COUNTER,
			},
			useFactory: createMultiplier,
			scope: "singleton",
		});
	});

	test("creates factory provider with scope", () => {
		const TOKEN = createToken<string>("TOKEN");
		const createValue = () => "value";

		const provider = provideFactory(TOKEN, {
			scope: "transient",
			useFactory: createValue,
		});

		expect(provider).toEqual({
			provide: TOKEN,
			scope: "transient",
			useFactory: createValue,
		});
	});

	test("creates factory provider with deps and scope", () => {
		const COUNTER = createToken<{ value: number }>("counter");
		const MULTIPLIER = createToken<{ value: number }>("multiplier");

		const createMultiplier = ({ counter }: { counter: { value: number } }) => ({
			value: counter.value * 2,
		});

		const provider = provideFactory(MULTIPLIER, {
			scope: "singleton",
			deps: {
				counter: COUNTER,
			},
			useFactory: createMultiplier,
		});

		expect(provider).toEqual({
			provide: MULTIPLIER,
			scope: "singleton",
			deps: {
				counter: COUNTER,
			},
			useFactory: createMultiplier,
		});
	});

	test("creates factory provider from class instance", () => {
		class Service {
			readonly value = "service";
		}

		const SERVICE = createToken<Service>("SERVICE");

		const provider = provideFactory(SERVICE, {
			useFactory: () => new Service(),
		});

		expect(provider.provide).toBe(SERVICE);
		expect(isFactoryProvider(provider)).toBe(true);
		expect(provider.useFactory({})).toBeInstanceOf(Service);
		expect(provider.useFactory({}).value).toBe("service");
	});

	test("detects value provider", () => {
		const TOKEN = createToken<string>("TOKEN");

		const provider = provideValue(TOKEN, "value");

		expect(isValueProvider(provider)).toBe(true);
		expect(isFactoryProvider(provider)).toBe(false);
	});

	test("detects factory provider", () => {
		const TOKEN = createToken<string>("TOKEN");

		const provider = provideFactory(TOKEN, {
			useFactory: () => "value",
		});

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

		provideFactory(TOKEN, {
			useFactory: () => "value",
		});

		provideFactory(TOKEN, {
			// @ts-expect-error number is not assignable to string
			useFactory: () => 123,
		});
	});

	test("infers factory deps types", () => {
		const COUNTER = createToken<{ value: number }>("counter");
		const MULTIPLIER = createToken<{ value: number }>("multiplier");

		provideFactory(MULTIPLIER, {
			deps: {
				counter: COUNTER,
			},
			useFactory: ({ counter }) => ({
				value: counter.value * 2,
			}),
		});
	});

	test("factory deps are typed by tokens", () => {
		const COUNTER = createToken<{ value: number }>("counter");
		const MULTIPLIER = createToken<{ value: number }>("multiplier");

		provideFactory(MULTIPLIER, {
			deps: {
				counter: COUNTER,
			},
			useFactory: ({ counter }) => ({
				value: counter.value * 2,
			}),
		});

		provideFactory(MULTIPLIER, {
			deps: {
				counter: COUNTER,
			},
			useFactory: ({ counter }) => {
				return {
					// @ts-expect-error property does not exist
					value: counter.missing,
				};
			},
		});
	});

	test("factory provider scope is typed", () => {
		const TOKEN = createToken<string>("TOKEN");

		provideFactory(TOKEN, {
			scope: "singleton",
			useFactory: () => "value",
		});

		provideFactory(TOKEN, {
			scope: "transient",
			useFactory: () => "value",
		});

		provideFactory(TOKEN, {
			// @ts-expect-error invalid scope
			scope: "request",
			useFactory: () => "value",
		});
	});
});

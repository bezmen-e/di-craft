import { describe, expect, test } from "bun:test";
import { createToken, provideFactory, provideValue, Scopes } from "../../index";
import {
	createNextDi,
	dehydrate,
	type Hydratable,
	type HydrationSchema,
	type RequestCache,
} from "./server";

type UserSnapshot = {
	readonly users: readonly string[];
};

class UserState implements Hydratable<UserSnapshot> {
	private readonly users: readonly string[];

	constructor(users: readonly string[]) {
		this.users = users;
	}

	dehydrate(): UserSnapshot {
		return {
			users: this.users,
		};
	}

	hydrate(_snapshot: UserSnapshot): void {}
}

const requestCache: RequestCache = <T>(factory: () => T): (() => T) => {
	let cachedValue: T | undefined;
	let hasCachedValue = false;

	return (): T => {
		if (!hasCachedValue) {
			cachedValue = factory();
			hasCachedValue = true;
		}

		return cachedValue as T;
	};
};

describe("next/server", () => {
	test("creates a root container with root providers", () => {
		const CONFIG = createToken<{ readonly baseUrl: string }>("CONFIG");

		const di = createNextDi({
			cache: requestCache,
			providers: [provideValue(CONFIG, { baseUrl: "https://example.com" })],
		});

		expect(di.getRootContainer().get(CONFIG)).toEqual({
			baseUrl: "https://example.com",
		});
	});

	test("returns one cached child container for the current request", () => {
		const CONFIG = createToken<string>("CONFIG");

		const di = createNextDi({
			cache: requestCache,
			providers: [provideValue(CONFIG, "root")],
		});

		const first = di.getRequestContainer();
		const second = di.getRequestContainer();

		expect(first).toBe(second);
		expect(first.get(CONFIG)).toBe("root");
	});

	test("registers request providers in the cached child container", () => {
		const REQUEST_ID = createToken<number>("REQUEST_ID");

		let calls = 0;

		const di = createNextDi({
			cache: requestCache,
			requestProviders: () => {
				calls += 1;

				return [provideValue(REQUEST_ID, calls)];
			},
		});

		const first = di.getRequestContainer();
		const second = di.getRequestContainer();

		expect(first).toBe(second);
		expect(first.get(REQUEST_ID)).toBe(1);
		expect(calls).toBe(1);
	});

	test("creates fresh manual request containers", () => {
		const REQUEST_STATE = createToken<{ readonly id: number }>("REQUEST_STATE");

		let calls = 0;

		const di = createNextDi({
			cache: requestCache,
			providers: [
				provideFactory(REQUEST_STATE, {
					scope: Scopes.Scoped,
					useFactory: () => {
						calls += 1;

						return { id: calls };
					},
				}),
			],
		});

		const first = di.createRequestContainer();
		const second = di.createRequestContainer();

		expect(first.get(REQUEST_STATE)).toBe(first.get(REQUEST_STATE));
		expect(first.get(REQUEST_STATE)).toEqual({ id: 1 });
		expect(second.get(REQUEST_STATE)).toEqual({ id: 2 });
	});

	test("dehydrates serializable state from the server container", () => {
		const USER_STATE = createToken<Hydratable<UserSnapshot>>("USER_STATE");
		const hydration = {
			user: USER_STATE,
		} satisfies HydrationSchema;

		const di = createNextDi({
			cache: requestCache,
			requestProviders: () => [
				provideValue(USER_STATE, new UserState(["Ada", "Grace"])),
			],
		});

		expect(
			dehydrate({
				container: di.getRequestContainer(),
				schema: hydration,
			}),
		).toEqual({
			user: {
				users: ["Ada", "Grace"],
			},
		});
	});

	test("throws when imported server helper is used in a browser runtime", () => {
		const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");

		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: {},
		});

		try {
			expect(() =>
				createNextDi({
					cache: requestCache,
				}),
			).toThrow("di-craft/next/server can only be used in a server runtime.");
		} finally {
			if (descriptor) {
				Object.defineProperty(globalThis, "window", descriptor);
			} else {
				Reflect.deleteProperty(globalThis, "window");
			}
		}
	});
});

import { describe, expect, test } from "bun:test";
import {
	createContainer,
	createToken,
	type Dependency,
	Injectable,
	InvalidProviderError,
	optional,
	provideInjectable,
	provideValue,
	Scopes,
} from "../index";

describe("annotation", () => {
	test("creates a provider from an injectable class", () => {
		const LOGGER = createToken<{ readonly prefix: string }>("LOGGER");
		const USERS = createToken<UserService>("USERS");

		@Injectable({ token: USERS, deps: [LOGGER] })
		class UserService {
			readonly logger: { readonly prefix: string };

			constructor(logger: { readonly prefix: string }) {
				this.logger = logger;
			}

			format(message: string): string {
				return `${this.logger.prefix}: ${message}`;
			}
		}

		const container = createContainer([
			provideValue(LOGGER, { prefix: "users" }),
			provideInjectable(UserService),
		]);

		expect(container.get(USERS)).toBeInstanceOf(UserService);
		expect(container.get(USERS).format("created")).toBe("users: created");
	});

	test("returns a regular factory provider", () => {
		const SERVICE = createToken<Service>("SERVICE");

		@Injectable({ token: SERVICE })
		class Service {}

		const provider = provideInjectable(Service);

		expect(provider.provide).toBe(SERVICE);
		expect(provider.scope).toBe(Scopes.Singleton);
		expect(provider.deps).toBeUndefined();
		expect(provider.useFactory({})).toBeInstanceOf(Service);
	});

	test("supports optional constructor dependencies", () => {
		const LOGGER = createToken<{ readonly info: (message: string) => void }>(
			"LOGGER",
		);
		const USERS = createToken<UserService>("USERS");

		@Injectable({ token: USERS, deps: [optional(LOGGER)] })
		class UserService {
			readonly logger: { readonly info: (message: string) => void } | undefined;

			constructor(
				logger: { readonly info: (message: string) => void } | undefined,
			) {
				this.logger = logger;
			}
		}

		const container = createContainer([provideInjectable(UserService)]);

		expect(container.get(USERS).logger).toBeUndefined();
	});

	test("passes scope and disposal options to the factory provider", async () => {
		const REQUEST_ID = createToken<string>("REQUEST_ID");
		const HANDLER = createToken<Handler>("HANDLER");
		const disposed: string[] = [];

		@Injectable({
			token: HANDLER,
			deps: [REQUEST_ID],
			scope: Scopes.Scoped,
			onDispose: (handler) => {
				disposed.push(handler.requestId);
			},
		})
		class Handler {
			readonly requestId: string;

			constructor(requestId: string) {
				this.requestId = requestId;
			}
		}

		const container = createContainer([
			provideValue(REQUEST_ID, "req-1"),
			provideInjectable(Handler),
		]);

		const first = container.get(HANDLER);
		const second = container.get(HANDLER);

		expect(first).toBe(second);
		expect(first.requestId).toBe("req-1");

		await container.dispose();

		expect(disposed).toEqual(["req-1"]);
	});

	test("throws when a class is not marked injectable", () => {
		class Service {}

		expect(() => provideInjectable(Service)).toThrow(InvalidProviderError);
		expect(() => provideInjectable(Service)).toThrow(
			'Class "Service" is not marked as injectable',
		);
	});

	test("injectable deps are typed by constructor parameters", () => {
		const NAME = createToken<string>("NAME");
		const COUNT = createToken<number>("COUNT");
		const SERVICE = createToken<Service>("SERVICE");

		@Injectable({ token: SERVICE, deps: [NAME, COUNT] })
		class Service {
			readonly name: string;
			readonly count: number;

			constructor(name: string, count: number) {
				this.name = name;
				this.count = count;
			}
		}

		expect(Service).toBeDefined();
	});

	test("injectable deps reject mismatched constructor parameters", () => {
		const COUNT = createToken<number>("COUNT");
		const SERVICE = createToken<Service>("SERVICE");

		// @ts-expect-error constructor parameter must match COUNT's number type
		@Injectable({ token: SERVICE, deps: [COUNT] })
		class Service {
			readonly count: string;

			constructor(count: string) {
				this.count = count;
			}
		}

		expect(Service).toBeDefined();
	});

	test("injectable without deps rejects constructor parameters", () => {
		const SERVICE = createToken<Service>("SERVICE");

		// @ts-expect-error constructor dependencies must be declared in deps
		@Injectable({ token: SERVICE })
		class Service {
			readonly name: string;

			constructor(name: string) {
				this.name = name;
			}
		}

		expect(Service).toBeDefined();
	});

	test("optional deps include undefined in constructor parameter type", () => {
		const NAME = createToken<string>("NAME");
		const SERVICE = createToken<Service>("SERVICE");

		@Injectable({ token: SERVICE, deps: [optional(NAME)] })
		class Service {
			readonly name: string | undefined;

			constructor(name: string | undefined) {
				this.name = name;
			}
		}

		expect(Service).toBeDefined();
	});

	test("dependency tuple type preserves token value types", () => {
		const NAME = createToken<string>("NAME");
		const COUNT = createToken<number>("COUNT");

		const deps = [
			NAME,
			optional(COUNT),
		] as const satisfies readonly Dependency<unknown>[];

		@Injectable({ token: createToken<Service>("SERVICE"), deps })
		class Service {
			readonly name: string;
			readonly count: number | undefined;

			constructor(name: string, count: number | undefined) {
				this.name = name;
				this.count = count;
			}
		}

		expect(Service).toBeDefined();
	});
});

import { describe, expect, test } from "bun:test";

import {
	createContainer,
	createToken,
	MissingProviderError,
	provideValue,
} from "../core";
import { dehydrate, hydrate } from "./hydration";
import type { Hydratable, HydrationSchema, HydrationSnapshot } from "./types";

type UserSnapshot = {
	readonly users: readonly string[];
};

type ThemeSnapshot = {
	readonly mode: string;
};

class UserState implements Hydratable<UserSnapshot> {
	private users: string[];

	constructor(users: readonly string[] = []) {
		this.users = [...users];
	}

	setUsers(users: readonly string[]): void {
		this.users = [...users];
	}

	dehydrate(): UserSnapshot {
		return {
			users: this.users,
		};
	}

	hydrate(snapshot: UserSnapshot): void {
		this.users = [...snapshot.users];
	}
}

class ThemeState implements Hydratable<ThemeSnapshot> {
	private mode: string;

	constructor(mode = "light") {
		this.mode = mode;
	}

	dehydrate(): ThemeSnapshot {
		return {
			mode: this.mode,
		};
	}

	hydrate(snapshot: ThemeSnapshot): void {
		this.mode = snapshot.mode;
	}
}

describe("hydration", () => {
	test("reads serializable snapshots from hydratable entities", () => {
		const USER_STATE = createToken<Hydratable<UserSnapshot>>("USER_STATE");
		const schema = {
			user: USER_STATE,
		} satisfies HydrationSchema;
		const container = createContainer([
			provideValue(USER_STATE, new UserState(["Ada", "Grace"])),
		]);

		expect(dehydrate({ container, schema })).toEqual({
			user: {
				users: ["Ada", "Grace"],
			},
		});
	});

	test("throws when dehydrating a missing token", () => {
		const schema = {
			user: undefined,
		} as unknown as HydrationSchema;
		const container = createContainer();

		expect(() => dehydrate({ container, schema })).toThrow(
			'Missing hydration token for key "user".',
		);
	});

	test("propagates missing provider errors", () => {
		const USER_STATE = createToken<Hydratable<UserSnapshot>>("USER_STATE");
		const schema = {
			user: USER_STATE,
		} satisfies HydrationSchema;
		const container = createContainer();

		expect(() => dehydrate({ container, schema })).toThrow(
			MissingProviderError,
		);
		expect(() =>
			hydrate({
				container,
				schema,
				snapshot: {
					user: {
						users: ["Ada"],
					},
				},
			}),
		).toThrow(MissingProviderError);
	});

	test("restores serializable snapshots into hydratable entities", () => {
		const USER_STATE = createToken<Hydratable<UserSnapshot>>("USER_STATE");
		const schema = {
			user: USER_STATE,
		} satisfies HydrationSchema;
		const state = new UserState();
		const container = createContainer([provideValue(USER_STATE, state)]);

		hydrate({
			container,
			schema,
			snapshot: {
				user: {
					users: ["Ada"],
				},
			},
		});

		expect(state.dehydrate()).toEqual({
			users: ["Ada"],
		});
	});

	test("throws when hydrating a missing token", () => {
		const schema = {
			user: undefined,
		} as unknown as HydrationSchema;
		const container = createContainer();

		expect(() =>
			hydrate({
				container,
				schema,
				snapshot: {} as HydrationSnapshot<typeof schema>,
			}),
		).toThrow('Missing hydration token for key "user".');
	});

	test("throws for a missing snapshot key", () => {
		const USER_STATE = createToken<Hydratable<UserSnapshot>>("USER_STATE");
		const schema = {
			user: USER_STATE,
		} satisfies HydrationSchema;
		const container = createContainer([
			provideValue(USER_STATE, new UserState()),
		]);

		expect(() =>
			hydrate({
				container,
				schema,
				snapshot: {} as HydrationSnapshot<typeof schema>,
			}),
		).toThrow('Missing hydration snapshot for key "user".');
	});

	test("hydrates independent schemas for separate boundaries", () => {
		const USER_STATE = createToken<Hydratable<UserSnapshot>>("USER_STATE");
		const THEME_STATE = createToken<Hydratable<ThemeSnapshot>>("THEME_STATE");
		const shellSchema = {
			theme: THEME_STATE,
		} satisfies HydrationSchema;
		const boundarySchema = {
			user: USER_STATE,
		} satisfies HydrationSchema;
		const userState = new UserState();
		const themeState = new ThemeState();
		const container = createContainer([
			provideValue(USER_STATE, userState),
			provideValue(THEME_STATE, themeState),
		]);

		hydrate({
			container,
			schema: shellSchema,
			snapshot: {
				theme: {
					mode: "dark",
				},
			},
		});

		expect(userState.dehydrate()).toEqual({ users: [] });
		expect(themeState.dehydrate()).toEqual({ mode: "dark" });

		hydrate({
			container,
			schema: boundarySchema,
			snapshot: {
				user: {
					users: ["Ada"],
				},
			},
		});

		expect(userState.dehydrate()).toEqual({ users: ["Ada"] });
		expect(themeState.dehydrate()).toEqual({ mode: "dark" });
	});

	test("applies repeated hydration of one token as an update", () => {
		const USER_STATE = createToken<Hydratable<UserSnapshot>>("USER_STATE");
		const schema = {
			user: USER_STATE,
		} satisfies HydrationSchema;
		const state = new UserState();
		const container = createContainer([provideValue(USER_STATE, state)]);

		hydrate({
			container,
			schema,
			snapshot: {
				user: {
					users: ["Ada"],
				},
			},
		});
		hydrate({
			container,
			schema,
			snapshot: {
				user: {
					users: ["Ada", "Grace"],
				},
			},
		});

		expect(state.dehydrate()).toEqual({
			users: ["Ada", "Grace"],
		});
	});

	test("round-trips snapshots incrementally into a client container", () => {
		const USER_STATE = createToken<UserState>("USER_STATE");
		const THEME_STATE = createToken<ThemeState>("THEME_STATE");
		const shellSchema = {
			theme: THEME_STATE,
		} satisfies HydrationSchema;
		const boundarySchema = {
			user: USER_STATE,
		} satisfies HydrationSchema;

		const serverUser = new UserState();
		serverUser.setUsers(["Ada", "Grace"]);
		const serverContainer = createContainer([
			provideValue(USER_STATE, serverUser),
			provideValue(THEME_STATE, new ThemeState("dark")),
		]);

		const clientUser = new UserState();
		const clientTheme = new ThemeState();
		const clientContainer = createContainer([
			provideValue(USER_STATE, clientUser),
			provideValue(THEME_STATE, clientTheme),
		]);

		// The shell snapshot crosses first, the streamed boundary snapshot later.
		hydrate({
			container: clientContainer,
			schema: shellSchema,
			snapshot: dehydrate({ container: serverContainer, schema: shellSchema }),
		});
		hydrate({
			container: clientContainer,
			schema: boundarySchema,
			snapshot: dehydrate({
				container: serverContainer,
				schema: boundarySchema,
			}),
		});

		expect(clientUser.dehydrate()).toEqual(serverUser.dehydrate());
		expect(clientTheme.dehydrate()).toEqual({ mode: "dark" });
	});
});

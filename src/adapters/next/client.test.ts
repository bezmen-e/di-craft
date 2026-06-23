import { describe, expect, test } from "bun:test";
import { createContainer, createToken, provideValue } from "../../index";
import {
	type Hydratable,
	type HydrationSchema,
	type HydrationSnapshot,
	hydrate,
} from "./client";

type UserSnapshot = {
	readonly users: readonly string[];
};

class UserState implements Hydratable<UserSnapshot> {
	private users: string[];

	constructor(users: readonly string[] = []) {
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

describe("next/client", () => {
	test("hydrates state from a serializable snapshot", () => {
		const USER_STATE = createToken<Hydratable<UserSnapshot>>("USER_STATE");
		const hydration = {
			user: USER_STATE,
		} satisfies HydrationSchema;
		const state = new UserState();
		const container = createContainer([provideValue(USER_STATE, state)]);

		hydrate({
			container,
			schema: hydration,
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

	test("throws for a missing snapshot key", () => {
		const USER_STATE = createToken<Hydratable<UserSnapshot>>("USER_STATE");
		const hydration = {
			user: USER_STATE,
		} satisfies HydrationSchema;
		const state = new UserState();
		const container = createContainer([provideValue(USER_STATE, state)]);

		expect(() =>
			hydrate({
				container,
				schema: hydration,
				snapshot: {} as HydrationSnapshot<typeof hydration>,
			}),
		).toThrow('Missing hydration snapshot for key "user".');
	});

	test("infers snapshot object shape from entries", () => {
		const USER_STATE = createToken<Hydratable<UserSnapshot>>("USER_STATE");
		const hydration = {
			user: USER_STATE,
		} satisfies HydrationSchema;

		type Snapshot = HydrationSnapshot<typeof hydration>;

		const snapshot: Snapshot = {
			user: {
				users: ["Ada"],
			},
		};

		expect(snapshot).toEqual({
			user: {
				users: ["Ada"],
			},
		});
	});
});

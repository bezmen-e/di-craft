import { createContainer, createToken, provideFactory } from "di-craft";
import { hydrate } from "di-craft/next/client";
import {
	dehydrate,
	type Hydratable,
	type HydrationSchema,
} from "di-craft/next/server";

type UserSnapshot = {
	readonly users: readonly string[];
};

class UserState implements Hydratable<UserSnapshot> {
	private users: readonly string[] = [];

	setUsers(users: readonly string[]): void {
		this.users = users;
	}

	dehydrate(): UserSnapshot {
		return { users: this.users };
	}

	hydrate(snapshot: UserSnapshot): void {
		this.users = snapshot.users;
	}
}

const USER_STATE = createToken<UserState>("USER_STATE");

const hydration = {
	user: USER_STATE,
} satisfies HydrationSchema;

const serverContainer = createContainer([
	provideFactory(USER_STATE, {
		useFactory: () => new UserState(),
	}),
]);

serverContainer.get(USER_STATE).setUsers(["Ada", "Grace"]);

const snapshot = dehydrate({
	container: serverContainer,
	schema: hydration,
});

const clientContainer = createContainer([
	provideFactory(USER_STATE, {
		useFactory: () => new UserState(),
	}),
]);

hydrate({
	container: clientContainer,
	schema: hydration,
	snapshot,
});

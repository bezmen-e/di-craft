import { createContainer, createToken, provideFactory } from "di-craft";
import {
	dehydrate,
	type Hydratable,
	type HydrationSchema,
	hydrate,
} from "di-craft/hydration";

type ThemeSnapshot = {
	readonly mode: string;
};

type UserSnapshot = {
	readonly users: readonly string[];
};

class ThemeState implements Hydratable<ThemeSnapshot> {
	private mode = "light";

	setMode(mode: string): void {
		this.mode = mode;
	}

	dehydrate(): ThemeSnapshot {
		return { mode: this.mode };
	}

	hydrate(snapshot: ThemeSnapshot): void {
		this.mode = snapshot.mode;
	}
}

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

const THEME_STATE = createToken<ThemeState>("THEME_STATE");
const USER_STATE = createToken<UserState>("USER_STATE");

// One schema per streaming boundary: the shell and one streamed boundary.
const shellSchema = {
	theme: THEME_STATE,
} satisfies HydrationSchema;

const conversationSchema = {
	user: USER_STATE,
} satisfies HydrationSchema;

const serverContainer = createContainer([
	provideFactory(THEME_STATE, {
		useFactory: () => new ThemeState(),
	}),
	provideFactory(USER_STATE, {
		useFactory: () => new UserState(),
	}),
]);

serverContainer.get(THEME_STATE).setMode("dark");
serverContainer.get(USER_STATE).setUsers(["Ada", "Grace"]);

// Each boundary snapshot crosses the boundary once, when that boundary is
// rendered on the server.
const shellSnapshot = dehydrate({
	container: serverContainer,
	schema: shellSchema,
});

const conversationSnapshot = dehydrate({
	container: serverContainer,
	schema: conversationSchema,
});

// The client owns a separate client-safe container.
const clientContainer = createContainer([
	provideFactory(THEME_STATE, {
		useFactory: () => new ThemeState(),
	}),
	provideFactory(USER_STATE, {
		useFactory: () => new UserState(),
	}),
]);

// The shell hydrates immediately, without waiting for streamed boundaries.
hydrate({
	container: clientContainer,
	schema: shellSchema,
	snapshot: shellSnapshot,
});

// Each streamed boundary hydrates when its snapshot arrives. Schemas are
// independent, and hydrating a token again applies the newer snapshot.
hydrate({
	container: clientContainer,
	schema: conversationSchema,
	snapshot: conversationSnapshot,
});

import { afterEach, describe, expect, setSystemTime, test } from "bun:test";

import { createContainer, createToken, provideValue } from "../core";
import { hydrate } from "./hydration";
import { createSnapshotBus } from "./snapshot-bus";
import type { Hydratable, HydrationSchema } from "./types";

type UserSnapshot = {
	readonly users: readonly string[];
};

class UserState implements Hydratable<UserSnapshot> {
	private users: string[] = [];

	dehydrate(): UserSnapshot {
		return {
			users: this.users,
		};
	}

	hydrate(snapshot: UserSnapshot): void {
		this.users = [...snapshot.users];
	}
}

const USER_STATE = createToken<Hydratable<UserSnapshot>>("USER_STATE");

const conversation = {
	user: USER_STATE,
} satisfies HydrationSchema;

const conversationSnapshot = {
	user: {
		users: ["Ada"],
	},
} as const;

const createClock = () => {
	let currentTime = 0;

	return {
		now: () => currentTime,
		advance: (ms: number) => {
			currentTime += ms;
		},
	};
};

describe("createSnapshotBus", () => {
	afterEach(() => {
		setSystemTime();
	});

	test("round-trips a pushed snapshot", () => {
		const bus = createSnapshotBus();

		bus.push(conversation, conversationSnapshot);

		expect(bus.pull(conversation)).toEqual(conversationSnapshot);
	});

	test("returns undefined for a schema that was never pushed", () => {
		const bus = createSnapshotBus();
		const other = {
			user: USER_STATE,
		} satisfies HydrationSchema;

		bus.push(conversation, conversationSnapshot);

		expect(bus.pull(other)).toBeUndefined();
	});

	test("keeps the entry for several late consumers", () => {
		const bus = createSnapshotBus();

		bus.push(conversation, conversationSnapshot);

		expect(bus.pull(conversation)).toEqual(conversationSnapshot);
		expect(bus.pull(conversation)).toEqual(conversationSnapshot);
	});

	test("expires entries immediately when the ttl is zero", () => {
		const bus = createSnapshotBus({ ttl: 0 });

		bus.push(conversation, conversationSnapshot);

		expect(bus.pull(conversation)).toBeUndefined();
	});

	test("expires entries after the ttl", () => {
		const clock = createClock();
		const bus = createSnapshotBus({ ttl: 1_000, now: clock.now });

		bus.push(conversation, conversationSnapshot);
		clock.advance(999);

		expect(bus.pull(conversation)).toEqual(conversationSnapshot);

		clock.advance(1);

		expect(bus.pull(conversation)).toBeUndefined();
	});

	test("resets the ttl when a schema is pushed again", () => {
		const clock = createClock();
		const bus = createSnapshotBus({ ttl: 1_000, now: clock.now });
		const updatedSnapshot = {
			user: {
				users: ["Ada", "Grace"],
			},
		} as const;

		bus.push(conversation, conversationSnapshot);
		clock.advance(800);
		bus.push(conversation, updatedSnapshot);
		clock.advance(800);

		expect(bus.pull(conversation)).toEqual(updatedSnapshot);
	});

	test("sweeps expired entries when pushing", () => {
		const clock = createClock();
		const bus = createSnapshotBus({ ttl: 100, now: clock.now });
		const other = {
			user: USER_STATE,
		} satisfies HydrationSchema;

		bus.push(conversation, conversationSnapshot);
		clock.advance(150);
		bus.push(other, conversationSnapshot);

		expect(bus.delete(conversation)).toBe(false);
		expect(bus.delete(other)).toBe(true);
	});

	test("reports an expired entry as already gone when deleting", () => {
		const clock = createClock();
		const bus = createSnapshotBus({ ttl: 100, now: clock.now });

		bus.push(conversation, conversationSnapshot);
		clock.advance(150);

		expect(bus.delete(conversation)).toBe(false);

		// The bus stays usable after dropping the expired entry.
		bus.push(conversation, conversationSnapshot);

		expect(bus.pull(conversation)).toEqual(conversationSnapshot);
	});

	test("deletes a single schema and clears every entry", () => {
		const bus = createSnapshotBus();

		bus.push(conversation, conversationSnapshot);

		expect(bus.delete(conversation)).toBe(true);
		expect(bus.pull(conversation)).toBeUndefined();

		bus.push(conversation, conversationSnapshot);
		bus.clear();

		expect(bus.pull(conversation)).toBeUndefined();
	});

	test("expires unread snapshots after the default ttl", () => {
		const base = Date.now();

		setSystemTime(new Date(base));

		const bus = createSnapshotBus();

		bus.push(conversation, conversationSnapshot);

		setSystemTime(new Date(base + 29_000));

		expect(bus.pull(conversation)).toEqual(conversationSnapshot);

		setSystemTime(new Date(base + 31_000));

		expect(bus.pull(conversation)).toBeUndefined();
	});

	test("hydrates a late consumer from a pulled snapshot", () => {
		const bus = createSnapshotBus();
		const state = new UserState();
		const container = createContainer([provideValue(USER_STATE, state)]);

		bus.push(conversation, conversationSnapshot);

		const cached = bus.pull(conversation);

		expect(cached).toBeDefined();

		if (cached !== undefined) {
			hydrate({
				container,
				schema: conversation,
				snapshot: cached,
			});
		}

		expect(state.dehydrate()).toEqual({
			users: ["Ada"],
		});
	});
});

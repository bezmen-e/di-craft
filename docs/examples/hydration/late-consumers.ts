import { createContainer, createToken, provideFactory } from "di-craft";
import {
	createSnapshotBus,
	dehydrate,
	type Hydratable,
	type HydrationSchema,
	hydrate,
} from "di-craft/hydration";

type ConversationSnapshot = {
	readonly messages: readonly string[];
};

class ConversationState implements Hydratable<ConversationSnapshot> {
	private messages: readonly string[] = [];

	setMessages(messages: readonly string[]): void {
		this.messages = messages;
	}

	dehydrate(): ConversationSnapshot {
		return { messages: this.messages };
	}

	hydrate(snapshot: ConversationSnapshot): void {
		this.messages = snapshot.messages;
	}
}

const CONVERSATION_STATE = createToken<ConversationState>("CONVERSATION_STATE");

const conversationSchema = {
	conversation: CONVERSATION_STATE,
} satisfies HydrationSchema;

const serverContainer = createContainer([
	provideFactory(CONVERSATION_STATE, {
		useFactory: () => new ConversationState(),
	}),
]);

serverContainer.get(CONVERSATION_STATE).setMessages(["Hello", "World"]);

// The server dehydrates the boundary schema while rendering.
const snapshot = dehydrate({
	container: serverContainer,
	schema: conversationSchema,
});

// The client owns a separate client-safe container and one bus per page.
const clientContainer = createContainer([
	provideFactory(CONVERSATION_STATE, {
		useFactory: () => new ConversationState(),
	}),
]);

const snapshots = createSnapshotBus();

// The streamed snapshot arrives before any dialog needs it, so the page
// parks it on the bus instead of refetching later.
snapshots.push(conversationSchema, snapshot);

// Seconds later a dialog mounts and pulls the parked snapshot. Pulling does
// not remove it, so a second consumer could hydrate from the same data.
const cached = snapshots.pull(conversationSchema);

if (cached !== undefined) {
	hydrate({
		container: clientContainer,
		schema: conversationSchema,
		snapshot: cached,
	});
}

// The dialog now reads hydrated state without a network request:
// clientContainer.get(CONVERSATION_STATE) holds the server messages.

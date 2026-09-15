import { createToken, provideFactory, provideValue, Scopes } from "di-craft";
import { createNextDi } from "di-craft/next/server";

type RequestCache = <T>(factory: () => T) => () => T;

// Server Actions use `runWithRequestContainer`, so this example does not rely
// on React request memoization. In a real Next app, pass `cache` from "react".
const requestCache: RequestCache = (factory) => factory;

type Actor = {
	readonly id: string;
};

class AuditLog {
	private readonly actor: Actor;

	constructor(actor: Actor) {
		this.actor = actor;
	}

	record(action: string): string {
		return `${this.actor.id}:${action}`;
	}
}

const ACTOR = createToken<Actor>("ACTOR");
const AUDIT_LOG = createToken<AuditLog>("AUDIT_LOG");

const { runWithRequestContainer } = createNextDi({
	cache: requestCache,
	providers: [
		provideFactory(AUDIT_LOG, {
			scope: Scopes.Scoped,
			deps: { actor: ACTOR },
			useFactory: ({ actor }) => new AuditLog(actor),
		}),
	],
});

export const saveUserAction = async (formData: FormData): Promise<string> => {
	"use server";

	// This is a fresh explicit scope for the Server Action. It is not the same
	// container created during a Page/RSC render.
	return runWithRequestContainer({
		providers: [
			provideValue(ACTOR, {
				id: String(formData.get("actorId") ?? "anonymous"),
			}),
		],
		run: async (container) => {
			return container.get(AUDIT_LOG).record("save-user");
		},
	});
};

const formData = new FormData();
formData.set("actorId", "user-1");

await saveUserAction(formData);

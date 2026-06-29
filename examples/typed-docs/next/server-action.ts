import { createToken, provideFactory, provideValue, Scopes } from "di-craft";
import { createNextDi } from "di-craft/next/server";

type RequestCache = <T>(factory: () => T) => () => T;

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

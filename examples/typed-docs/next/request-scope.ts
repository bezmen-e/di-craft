import { createToken, provideFactory, provideValue, Scopes } from "di-craft";
import { createNextDi } from "di-craft/next/server";

type RequestCache = <T>(factory: () => T) => () => T;

const requestCache: RequestCache = (factory) => {
	let cached: unknown;
	let hasCachedValue = false;

	return () => {
		if (!hasCachedValue) {
			cached = factory();
			hasCachedValue = true;
		}

		return cached as ReturnType<typeof factory>;
	};
};

class UserService {
	readonly requestId: string;

	constructor(requestId: string) {
		this.requestId = requestId;
	}
}

const REQUEST_ID = createToken<string>("REQUEST_ID");
const USERS = createToken<UserService>("USERS");

const { getRequestContainer, runWithRequestContainer } = createNextDi({
	cache: requestCache,
	providers: [
		provideFactory(USERS, {
			scope: Scopes.Scoped,
			deps: { requestId: REQUEST_ID },
			useFactory: ({ requestId }) => new UserService(requestId),
		}),
	],
	requestProviders: () => [provideValue(REQUEST_ID, crypto.randomUUID())],
});

const container = getRequestContainer();
const service = container.get(USERS);

await runWithRequestContainer({
	run: async (requestContainer) => requestContainer.get(USERS),
});

service.requestId;

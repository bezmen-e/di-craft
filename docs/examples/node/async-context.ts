import { createToken, provideFactory, provideValue, Scopes } from "di-craft";
import { createNodeDi } from "di-craft/node";

type RequestContext = {
	readonly requestId: string;
};

class UsersService {
	private readonly requestContext: RequestContext;

	constructor(requestContext: RequestContext) {
		this.requestContext = requestContext;
	}

	list(): readonly string[] {
		return [`users:${this.requestContext.requestId}`];
	}
}

const REQUEST_CONTEXT = createToken<RequestContext>("REQUEST_CONTEXT");
const USERS_SERVICE = createToken<UsersService>("USERS_SERVICE");

const { getRequestContainer, runWithRequestContainer } = createNodeDi({
	providers: [
		provideFactory(USERS_SERVICE, {
			scope: Scopes.Scoped,
			deps: { requestContext: REQUEST_CONTEXT },
			useFactory: ({ requestContext }) => new UsersService(requestContext),
		}),
	],
});

const listUsers = async (): Promise<readonly string[]> => {
	await Promise.resolve();

	return getRequestContainer().get(USERS_SERVICE).list();
};

await runWithRequestContainer({
	providers: [
		provideValue(REQUEST_CONTEXT, {
			requestId: crypto.randomUUID(),
		}),
	],
	run: async () => listUsers(),
});

import { createToken, provideFactory, provideValue, Scopes } from "di-craft";
import { createNextDi } from "di-craft/next/server";

type RequestCache = <T>(factory: () => T) => () => T;

const createRequestCache = (): RequestCache => {
	let cached: unknown;
	let hasCachedValue = false;

	return (factory) => {
		return () => {
			if (!hasCachedValue) {
				cached = factory();
				hasCachedValue = true;
			}

			return cached as ReturnType<typeof factory>;
		};
	};
};

type RequestContext = {
	readonly requestId: string;
};

class UsersService {
	private readonly requestContext: RequestContext;

	constructor(requestContext: RequestContext) {
		this.requestContext = requestContext;
	}

	list(): readonly string[] {
		return ["Ada", "Grace", this.requestContext.requestId];
	}
}

const REQUEST_CONTEXT = createToken<RequestContext>("REQUEST_CONTEXT");
const USERS_SERVICE = createToken<UsersService>("USERS_SERVICE");

const { getRequestContainer } = createNextDi({
	cache: createRequestCache(),
	providers: [
		provideFactory(USERS_SERVICE, {
			scope: Scopes.Scoped,
			deps: { requestContext: REQUEST_CONTEXT },
			useFactory: ({ requestContext }) => new UsersService(requestContext),
		}),
	],
	requestProviders: () => [
		provideValue(REQUEST_CONTEXT, {
			requestId: crypto.randomUUID(),
		}),
	],
});

type ViewModel = {
	readonly title: string;
	readonly users: readonly string[];
	readonly count: number;
};

const UsersList = async (): Promise<readonly string[]> => {
	return getRequestContainer().get(USERS_SERVICE).list();
};

const UsersCount = async (): Promise<number> => {
	return getRequestContainer().get(USERS_SERVICE).list().length;
};

const Page = async (): Promise<ViewModel> => {
	const users = await UsersList();
	const count = await UsersCount();

	return {
		title: "Users",
		users,
		count,
	};
};

await Page();

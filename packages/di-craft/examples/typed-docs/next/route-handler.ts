import { createToken, provideFactory, provideValue, Scopes } from "di-craft";
import { createNextDi } from "di-craft/next/server";

type RequestCache = <T>(factory: () => T) => () => T;

// Route Handlers use `runWithRequestContainer`, so this example does not rely
// on React request memoization. In a real Next app, pass `cache` from "react".
const requestCache: RequestCache = (factory) => factory;

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

const { runWithRequestContainer } = createNextDi({
	cache: requestCache,
	providers: [
		provideFactory(USERS_SERVICE, {
			scope: Scopes.Scoped,
			deps: { requestContext: REQUEST_CONTEXT },
			useFactory: ({ requestContext }) => new UsersService(requestContext),
		}),
	],
});

export const GET = async (request: Request): Promise<Response> => {
	// This is a fresh explicit scope for the Route Handler. It is not the same
	// container created during a Page/RSC render.
	return runWithRequestContainer({
		providers: [
			provideValue(REQUEST_CONTEXT, {
				requestId: request.headers.get("x-request-id") ?? crypto.randomUUID(),
			}),
		],
		run: async (container) => {
			const users = container.get(USERS_SERVICE).list();

			return Response.json({ users });
		},
	});
};

await GET(new Request("https://example.com/users"));

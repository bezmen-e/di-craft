import {
	createChildContainer,
	createContainer,
	createToken,
	provideFactory,
	provideValue,
	Scopes,
} from "di-craft";

type Request = {
	readonly id: string;
};

class RequestState {
	readonly request: Request;

	constructor(request: Request) {
		this.request = request;
	}
}

const REQUEST = createToken<Request>("REQUEST");
const REQUEST_STATE = createToken<RequestState>("REQUEST_STATE");

const root = createContainer([
	provideFactory(REQUEST_STATE, {
		scope: Scopes.Scoped,
		deps: { request: REQUEST },
		useFactory: ({ request }) => new RequestState(request),
	}),
]);

const requestA = createChildContainer(root, [
	provideValue(REQUEST, { id: "request-a" }),
]);
const requestB = createChildContainer(root, [
	provideValue(REQUEST, { id: "request-b" }),
]);

const firstA = requestA.get(REQUEST_STATE);
const secondA = requestA.get(REQUEST_STATE);
const firstB = requestB.get(REQUEST_STATE);

firstA === secondA; // true
firstA === firstB; // false

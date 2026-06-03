import {
	createContainer,
	createToken,
	type Provider,
	provideFactory,
	provideValue,
} from "./index";

const COUNTER = createToken<{ value: number }>("counter");
const MULTIPLIER = createToken<{ value: number }>("multiplier");

const providers: Provider[] = [
	provideValue(COUNTER, { value: 5 }),
	provideFactory(MULTIPLIER, {
		deps: {
			counter: COUNTER,
		},
		useFactory: ({ counter }) => ({
			value: counter.value * 2,
		}),
	}),
];

const container = createContainer(providers);

const multiplier = container.get(MULTIPLIER);

console.log(multiplier);

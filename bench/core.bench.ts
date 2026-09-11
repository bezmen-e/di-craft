import { bench, do_not_optimize, group, run, summary } from "mitata";
import {
	createChildContainer,
	createContainer,
	createToken,
	optional,
	type Provider,
	provideFactory,
	provideValue,
	Scopes,
} from "../src/index.ts";

type Service = {
	readonly value: number;
};

const createValueProviders = (count: number): Provider[] =>
	Array.from({ length: count }, (_, index) =>
		provideValue(createToken<number>(`value-${index}`), index),
	);

const createTransientChain = (depth: number) => {
	const firstToken = createToken<number>("chain-0");
	const providers: Provider[] = [provideValue(firstToken, 1)];
	let previousToken = firstToken;

	for (let index = 1; index <= depth; index += 1) {
		const currentToken = createToken<number>(`chain-${index}`);
		const dependencyToken = previousToken;

		providers.push(
			provideFactory(currentToken, {
				deps: { previous: dependencyToken },
				scope: Scopes.Transient,
				useFactory: ({ previous }) => previous + 1,
			}),
		);

		previousToken = currentToken;
	}

	return {
		container: createContainer(providers),
		token: previousToken,
	};
};

const VALUE = createToken<number>("VALUE");
const SINGLETON = createToken<Service>("SINGLETON");
const TRANSIENT = createToken<Service>("TRANSIENT");
const SCOPED = createToken<Service>("SCOPED");
const MISSING = createToken<number>("MISSING");

const FAN_A = createToken<number>("FAN_A");
const FAN_B = createToken<number>("FAN_B");
const FAN_C = createToken<number>("FAN_C");
const FAN_D = createToken<number>("FAN_D");
const FAN_E = createToken<number>("FAN_E");
const FAN_F = createToken<number>("FAN_F");
const FAN_G = createToken<number>("FAN_G");
const FAN_H = createToken<number>("FAN_H");
const FAN_I = createToken<number>("FAN_I");
const FAN_J = createToken<number>("FAN_J");
const FAN_OUT = createToken<number>("FAN_OUT");

const valueProvider = provideValue(VALUE, 42);
const singletonProvider = provideFactory(SINGLETON, {
	useFactory: () => ({ value: 42 }),
});
const transientProvider = provideFactory(TRANSIENT, {
	scope: Scopes.Transient,
	useFactory: () => ({ value: 42 }),
});
const scopedProvider = provideFactory(SCOPED, {
	scope: Scopes.Scoped,
	useFactory: () => ({ value: 42 }),
});
const fanOutProvider = provideFactory(FAN_OUT, {
	deps: {
		a: FAN_A,
		b: FAN_B,
		c: FAN_C,
		d: FAN_D,
		e: FAN_E,
		f: FAN_F,
		g: FAN_G,
		h: FAN_H,
		i: FAN_I,
		j: FAN_J,
	},
	scope: Scopes.Transient,
	useFactory: ({ a, b, c, d, e, f, g, h, i, j }) =>
		a + b + c + d + e + f + g + h + i + j,
});

const valueProviders10 = createValueProviders(10);
const valueProviders100 = createValueProviders(100);

const valueContainer = createContainer([valueProvider]);

const singletonHotContainer = createContainer([singletonProvider]);
singletonHotContainer.get(SINGLETON);

const transientContainer = createContainer([transientProvider]);

const fanOutContainer = createContainer([
	provideValue(FAN_A, 1),
	provideValue(FAN_B, 2),
	provideValue(FAN_C, 3),
	provideValue(FAN_D, 4),
	provideValue(FAN_E, 5),
	provideValue(FAN_F, 6),
	provideValue(FAN_G, 7),
	provideValue(FAN_H, 8),
	provideValue(FAN_I, 9),
	provideValue(FAN_J, 10),
	fanOutProvider,
]);

const transientChain = createTransientChain(10);

const rootContainer = createContainer([valueProvider, scopedProvider]);
const childContainer = createChildContainer(rootContainer);
const nestedChildContainer = createChildContainer(
	createChildContainer(createChildContainer(rootContainer)),
);
childContainer.get(SCOPED);

const optionalValue = optional(VALUE);
const optionalMissing = optional(MISSING);

summary(() => {
	group("provider construction", () => {
		bench("createToken", () => {
			do_not_optimize(createToken<number>("TOKEN"));
		});

		bench("provideValue", () => {
			do_not_optimize(provideValue(VALUE, 42));
		});

		bench("provideFactory", () => {
			do_not_optimize(
				provideFactory(SINGLETON, {
					useFactory: () => ({ value: 42 }),
				}),
			);
		});
	});

	group("container creation", () => {
		bench("createContainer with 1 provider", () => {
			do_not_optimize(createContainer([valueProvider]));
		});

		bench("createContainer with 10 providers", () => {
			do_not_optimize(createContainer(valueProviders10));
		});

		bench("createContainer with 100 providers", () => {
			do_not_optimize(createContainer(valueProviders100));
		});
	});

	group("resolution", () => {
		bench("resolve value provider", () => {
			do_not_optimize(valueContainer.get(VALUE));
		});

		bench("resolve singleton factory (hot cache)", () => {
			do_not_optimize(singletonHotContainer.get(SINGLETON));
		});

		bench("create container + resolve singleton factory", () => {
			const container = createContainer([singletonProvider]);

			do_not_optimize(container.get(SINGLETON));
		});

		bench("resolve transient factory", () => {
			do_not_optimize(transientContainer.get(TRANSIENT));
		});

		bench("resolve transient factory with 10 deps", () => {
			do_not_optimize(fanOutContainer.get(FAN_OUT));
		});

		bench("resolve transient dependency chain depth 10", () => {
			do_not_optimize(transientChain.container.get(transientChain.token));
		});
	});

	group("child containers and optional deps", () => {
		bench("resolve parent value through 3 child containers", () => {
			do_not_optimize(nestedChildContainer.get(VALUE));
		});

		bench("resolve scoped provider (hot child cache)", () => {
			do_not_optimize(childContainer.get(SCOPED));
		});

		bench("create child + resolve scoped provider", () => {
			const child = createChildContainer(rootContainer);

			do_not_optimize(child.get(SCOPED));
		});

		bench("resolve optional value provider", () => {
			do_not_optimize(valueContainer.get(optionalValue));
		});

		bench("resolve optional missing provider", () => {
			do_not_optimize(valueContainer.get(optionalMissing));
		});
	});
});

await run({
	format: { mitata: { name: "longest" } },
	throw: true,
});

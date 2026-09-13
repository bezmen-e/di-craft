import {
	createChildContainer,
	createContainer,
	createToken,
	optional,
	provideFactory,
	provideValue,
	Scopes,
} from "../src/index.ts";

type Service = {
	readonly value: number;
};

const ITERATIONS = Number(Bun.env.DI_CRAFT_PROFILE_ITERATIONS ?? 500_000);

const VALUE = createToken<number>("VALUE");
const REQUEST_ID = createToken<number>("REQUEST_ID");
const TRANSIENT = createToken<Service>("TRANSIENT");
const SCOPED = createToken<Service>("SCOPED");
const OPTIONAL_MISSING = createToken<number>("OPTIONAL_MISSING");

const DEP_A = createToken<number>("DEP_A");
const DEP_B = createToken<number>("DEP_B");
const DEP_C = createToken<number>("DEP_C");
const DEP_D = createToken<number>("DEP_D");
const DEP_E = createToken<number>("DEP_E");
const DEP_F = createToken<number>("DEP_F");
const DEP_G = createToken<number>("DEP_G");
const DEP_H = createToken<number>("DEP_H");
const DEP_I = createToken<number>("DEP_I");
const DEP_J = createToken<number>("DEP_J");
const FAN_OUT = createToken<number>("FAN_OUT");

const root = createContainer([
	provideValue(VALUE, 42),
	provideValue(DEP_A, 1),
	provideValue(DEP_B, 2),
	provideValue(DEP_C, 3),
	provideValue(DEP_D, 4),
	provideValue(DEP_E, 5),
	provideValue(DEP_F, 6),
	provideValue(DEP_G, 7),
	provideValue(DEP_H, 8),
	provideValue(DEP_I, 9),
	provideValue(DEP_J, 10),
	provideFactory(TRANSIENT, {
		scope: Scopes.Transient,
		useFactory: () => ({ value: 42 }),
	}),
	provideFactory(SCOPED, {
		deps: { requestId: REQUEST_ID },
		scope: Scopes.Scoped,
		useFactory: ({ requestId }) => ({ value: requestId }),
	}),
	provideFactory(FAN_OUT, {
		deps: {
			a: DEP_A,
			b: DEP_B,
			c: DEP_C,
			d: DEP_D,
			e: DEP_E,
			f: DEP_F,
			g: DEP_G,
			h: DEP_H,
			i: DEP_I,
			j: DEP_J,
		},
		scope: Scopes.Transient,
		useFactory: ({ a, b, c, d, e, f, g, h, i, j }) =>
			a + b + c + d + e + f + g + h + i + j,
	}),
]);

const child = createChildContainer(root, [provideValue(REQUEST_ID, 7)]);
const optionalMissing = optional(OPTIONAL_MISSING);

let checksum = 0;
const startedAt = performance.now();

for (let index = 0; index < ITERATIONS; index += 1) {
	checksum += root.get(VALUE);
	checksum += root.get(TRANSIENT).value;
	checksum += root.get(FAN_OUT);
	checksum += child.get(SCOPED).value;

	if ((index & 255) === 0) {
		checksum += child.get(optionalMissing) ?? 0;
	}

	if ((index & 1023) === 0) {
		const request = createChildContainer(root, [
			provideValue(REQUEST_ID, index),
		]);

		checksum += request.get(SCOPED).value;
	}
}

const durationMs = performance.now() - startedAt;

console.log(
	JSON.stringify(
		{
			checksum,
			durationMs: Math.round(durationMs),
			iterations: ITERATIONS,
		},
		null,
		2,
	),
);

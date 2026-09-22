import { describe, expect, test } from "bun:test";
import {
	type Container,
	createContainer,
	createToken,
	type Factory,
	type FactoryProvider,
	type OptionalDependency,
	optional,
	provideFactory,
	provideValue,
	type ResolveDeps,
	type ResolvedDependency,
	type Token,
	type ValueProvider,
} from "../../index";

type Equal<TActual, TExpected> =
	(<T>() => T extends TActual ? 1 : 2) extends <T>() => T extends TExpected
		? 1
		: 2
		? (<T>() => T extends TExpected ? 1 : 2) extends <T>() => T extends TActual
				? 1
				: 2
			? true
			: false
		: false;

type Expect<TValue extends true> = TValue;

describe("public API types", () => {
	test("preserves token value types", () => {
		type User = {
			readonly name: string;
		};

		const USER = createToken<User>("USER");

		const typeChecks: [Expect<Equal<typeof USER, Token<User>>>] = [true];

		expect(typeChecks).toEqual([true]);
	});

	test("preserves value provider types", () => {
		type Config = {
			readonly debug: boolean;
		};

		const CONFIG = createToken<Config>("CONFIG");
		const provider = provideValue(CONFIG, { debug: true });

		const typeChecks: [Expect<Equal<typeof provider, ValueProvider<Config>>>] =
			[true];

		expect(typeChecks).toEqual([true]);
	});

	test("infers factory dependency values from tokens", () => {
		type Config = {
			readonly baseUrl: string;
		};

		type Logger = {
			readonly log: (message: string) => void;
		};

		type Service = {
			readonly url: string;
			readonly hasLogger: boolean;
		};

		const CONFIG = createToken<Config>("CONFIG");
		const LOGGER = createToken<Logger>("LOGGER");
		const SERVICE = createToken<Service>("SERVICE");
		const loggerDependency = optional(LOGGER);

		const provider = provideFactory(SERVICE, {
			deps: {
				config: CONFIG,
				logger: loggerDependency,
			},
			useFactory: ({ config, logger }) => ({
				url: config.baseUrl,
				hasLogger: logger !== undefined,
			}),
		});

		type Deps = {
			config: Token<Config>;
			logger: OptionalDependency<Logger>;
		};

		type FactoryDeps = Parameters<typeof provider.useFactory>[0];
		type ServiceFactory = Factory<Service, Deps>;

		const typeChecks: [
			Expect<Equal<typeof provider, FactoryProvider<Service, Deps>>>,
			Expect<Equal<ResolvedDependency<Token<Config>>, Config>>,
			Expect<Equal<ResolveDeps<Deps>, FactoryDeps>>,
			Expect<Equal<ReturnType<ServiceFactory>, Service>>,
			Expect<
				Equal<
					FactoryDeps,
					{
						readonly config: Config;
						readonly logger: Logger | undefined;
					}
				>
			>,
		] = [true, true, true, true, true];

		expect(typeChecks).toEqual([true, true, true, true, true]);
	});

	test("returns required and optional container values", () => {
		type User = {
			readonly name: string;
		};

		const USER = createToken<User>("USER");
		const container = createContainer([provideValue(USER, { name: "Ada" })]);

		const user = container.get(USER);
		const optionalUser = container.get(optional(USER));

		const typeChecks: [
			Expect<Equal<typeof container, Container>>,
			Expect<Equal<typeof user, User>>,
			Expect<Equal<typeof optionalUser, User | undefined>>,
		] = [true, true, true];

		expect(typeChecks).toEqual([true, true, true]);
	});

	test("rejects invalid public API usage", () => {
		const invalidUsage = () => {
			const PORT = createToken<number>("PORT");
			// @ts-expect-error A string cannot satisfy Token<number>.
			provideValue(PORT, "3000");

			type Config = { readonly apiUrl: string };
			const CONFIG = createToken<Config>("CONFIG");
			const API_URL = createToken<string>("API_URL");

			provideFactory(API_URL, {
				deps: { config: CONFIG },
				// @ts-expect-error Config has no "missing" property.
				useFactory: ({ config }) => config.missing,
			});

			type Logger = { info(message: string): void };
			const LOGGER = createToken<Logger>("LOGGER");
			const container = createContainer();

			// @ts-expect-error Optional resolution returns Logger | undefined.
			const logger: Logger = container.get(optional(LOGGER));
			return logger;
		};

		expect(typeof invalidUsage).toBe("function");
	});
});

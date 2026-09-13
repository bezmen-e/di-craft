import { type Scope, Scopes } from "../scope";
import type { Token } from "../token";
import { InvalidProviderError } from "./errors";
import type {
	AnyFactoryProvider,
	Dependency,
	DepsMap,
	DisposeHook,
	Factory,
	FactoryProvider,
	OptionalDependency,
	Provider,
	ValueProvider,
} from "./types";

/**
 * Creates a provider for an already constructed value.
 *
 * The value must match the token type.
 *
 * @example
 * ```ts
 * provideValue(PORT, 3000);
 * ```
 */
export const provideValue = <T>(
	token: Token<T>,
	useValue: T,
): ValueProvider<T> => ({
	provide: token,
	useValue,
});

/**
 * Creates a provider that lazily builds a value.
 *
 * Dependencies declared in `deps` become the object passed to `useFactory`.
 * The factory return type must match the token type.
 *
 * @example
 * ```ts
 * provideFactory(HTTP, {
 *   deps: { config: CONFIG },
 *   useFactory: ({ config }) => new HttpClient(config.apiUrl),
 * });
 * ```
 */
export const provideFactory = <T, TDeps extends DepsMap = Record<never, never>>(
	token: Token<T>,
	options: {
		readonly deps?: TDeps;
		readonly scope?: Scope;
		readonly useFactory: Factory<T, TDeps>;
		readonly onDispose?: DisposeHook<T>;
	},
): FactoryProvider<T, TDeps> => {
	// Transient instances aren't cached, so onDispose could never run.
	if (options.scope === Scopes.Transient && options.onDispose) {
		throw new InvalidProviderError(
			`onDispose is not supported for transient providers (token "${token.name}"): transient instances are not tracked, so the hook would never run.`,
		);
	}

	return {
		provide: token,
		useFactory: options.useFactory,
		scope: options.scope ?? Scopes.Singleton,
		...(options.deps ? { deps: options.deps } : {}),
		...(options.onDispose ? { onDispose: options.onDispose } : {}),
	};
};

/**
 * Marks a token as optional.
 *
 * Optional dependencies resolve to `undefined` instead of throwing when no
 * provider exists in the container chain. They can be used in factory `deps`
 * or passed directly to `container.get`.
 *
 * @example
 * ```ts
 * const logger = container.get(optional(LOGGER));
 * ```
 */
export const optional = <T>(token: Token<T>): OptionalDependency<T> => ({
	token,
	optional: true,
});

export const isOptionalDependency = <T>(
	dependency: Dependency<T>,
): dependency is OptionalDependency<T> => {
	return (dependency as OptionalDependency<T>).optional === true;
};

export const isValueProvider = (
	provider: Provider,
): provider is ValueProvider<unknown> => {
	return "useValue" in provider;
};

export const isFactoryProvider = (
	provider: Provider,
): provider is AnyFactoryProvider => {
	return "useFactory" in provider;
};

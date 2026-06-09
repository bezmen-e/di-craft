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

export const provideValue = <T>(
	token: Token<T>,
	useValue: T,
): ValueProvider<T> => ({
	provide: token,
	useValue,
});

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

// Marks a dependency optional: resolves to undefined when no provider exists.
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

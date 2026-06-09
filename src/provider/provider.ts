import { type Scope, Scopes } from "../scope";
import type { Token } from "../token";
import { InvalidProviderError } from "./errors";
import type {
	AnyFactoryProvider,
	DepsMap,
	DisposeHook,
	Factory,
	FactoryProvider,
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
	// Transient instances are never cached, so dispose hooks would never run.
	// Fail fast instead of silently ignoring the hook.
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

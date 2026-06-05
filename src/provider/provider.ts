import type { Token } from "../token";
import type {
	AnyFactoryProvider,
	DepsMap,
	DisposeHook,
	Factory,
	FactoryProvider,
	Provider,
	Scope,
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
	const provider = {
		provide: token,
		useFactory: options.useFactory,
	};

	return {
		...provider,
		...(options.deps ? { deps: options.deps } : {}),
		...(options.scope ? { scope: options.scope } : {}),
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

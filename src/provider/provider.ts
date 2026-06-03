import type { Token } from "../token";
import type {
	DepsMap,
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
	};
};

export const isValueProvider = <T>(
	provider: Provider<T>,
): provider is ValueProvider<T> => {
	return "useValue" in provider;
};

export const isFactoryProvider = <T>(
	provider: Provider<T>,
): provider is FactoryProvider<T> => {
	return "useFactory" in provider;
};

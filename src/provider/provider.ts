import type { Token } from "../token";
import type {
	DepsMap,
	Factory,
	FactoryProvider,
	Provider,
	ValueProvider,
} from "./types";

export const provideValue = <T>(
	provide: Token<T>,
	useValue: T,
): ValueProvider<T> => ({
	provide,
	useValue,
});

export const provideFactory = <T, TDeps extends DepsMap = Record<never, never>>(
	provide: Token<T>,
	options: {
		readonly deps?: TDeps;
		readonly useFactory: Factory<T, TDeps>;
	},
): FactoryProvider<T, TDeps> => {
	const provider = {
		provide,
		useFactory: options.useFactory,
	};

	if (!options.deps) {
		return provider;
	}

	return {
		...provider,
		deps: options.deps,
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

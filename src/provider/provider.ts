import type { FactoryProvider, Provider, ValueProvider } from "./types";

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

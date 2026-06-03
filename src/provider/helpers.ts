import type { Token } from "../token";
import type { FactoryProvider, ValueProvider } from "./types";

export const provideValue = <T>(
	provide: Token<T>,
	useValue: T,
): ValueProvider<T> => ({
	provide,
	useValue,
});

export const provideFactory = <T>(
	provide: Token<T>,
	useFactory: () => T,
): FactoryProvider<T> => ({
	provide,
	useFactory,
});

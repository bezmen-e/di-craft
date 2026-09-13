export { InvalidProviderError } from "./errors";
export {
	isFactoryProvider,
	isOptionalDependency,
	isValueProvider,
	optional,
	provideFactory,
	provideValue,
} from "./provider";

export type {
	Dependency,
	DepsMap,
	DisposeHook,
	FactoryProvider,
	OptionalDependency,
	Provider,
	ResolveDeps,
	ValueProvider,
} from "./types";

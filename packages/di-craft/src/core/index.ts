/**
 * A tiny, type-safe dependency injection container for TypeScript.
 *
 * @module
 */

export type {
	InjectableClass,
	InjectableConstructor,
	InjectableOptions,
	ResolveDependencyTuple,
} from "./annotation";
export { Injectable, provideInjectable } from "./annotation";
export type { Container } from "./container";
export { createChildContainer, createContainer } from "./container";
export { DiError } from "./error";
export type {
	Dependency,
	DepsMap,
	DisposeHook,
	Factory,
	FactoryProvider,
	OptionalDependency,
	Provider,
	ResolveDeps,
	ResolvedDependency,
	ValueProvider,
} from "./provider";
export {
	InvalidProviderError,
	optional,
	provideFactory,
	provideValue,
} from "./provider";
export type { RegisterOptions } from "./registry";
export { DuplicateProviderError } from "./registry";
export {
	CircularDependencyError,
	InvalidDependencyError,
	MissingProviderError,
} from "./resolver";
export type { Scope } from "./scope";
export { Scopes } from "./scope";
export type { Token } from "./token";
export { createToken } from "./token";

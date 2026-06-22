import {
	type Dependency,
	type DepsMap,
	type DisposeHook,
	type FactoryProvider,
	InvalidProviderError,
	provideFactory,
	type ResolveDeps,
} from "../provider";
import type { Token } from "../token";
import { tupleDepsToMap } from "./deps";
import { getInjectableMetadata, setInjectableMetadata } from "./metadata";
import type {
	InjectableClass,
	InjectableConstructor,
	InjectableOptions,
} from "./types";

type Constructable<T> = new (...args: unknown[]) => T;
type InjectableDecorator<TTarget> = (
	target: TTarget,
	context: ClassDecoratorContext,
) => void;

type InjectableOptionsWithoutDeps<T> = Omit<
	InjectableOptions<T, readonly []>,
	"deps"
>;

const ANONYMOUS_CLASS_NAME = "<anonymous>";

const assertClassDecorator = (options: {
	readonly target: InjectableClass;
	readonly context: ClassDecoratorContext;
}): void => {
	const { context, target } = options;
	const isClassDecorator =
		context.kind === "class" && typeof target === "function";

	if (!isClassDecorator) {
		throw new InvalidProviderError("@Injectable can only decorate classes");
	}
};

// Overloads keep constructor parameters aligned with explicit deps. The single
// runtime implementation is below.
export function Injectable<
	T,
	const TDeps extends readonly Dependency<unknown>[],
>(
	options: InjectableOptions<T, TDeps> & { readonly deps: TDeps },
): InjectableDecorator<InjectableConstructor<T, TDeps>>;

export function Injectable<T>(
	options: InjectableOptionsWithoutDeps<T>,
): InjectableDecorator<InjectableConstructor<T, readonly []>>;
/**
 * Marks a class as an injectable provider for a token.
 *
 * Dependencies are explicit and ordered by constructor parameter position. No
 * `reflect-metadata`, parameter decorators, or global container are used.
 *
 * @example
 * ```ts
 * @Injectable({ token: USER_SERVICE, deps: [LOGGER] })
 * class UserService {
 *   private readonly logger: Logger;
 *
 *   constructor(logger: Logger) {
 *     this.logger = logger;
 *   }
 * }
 * ```
 */
export function Injectable<T>(
	options: InjectableOptions<T>,
): InjectableDecorator<InjectableClass<T>> {
	return (target: InjectableClass<T>, context: ClassDecoratorContext): void => {
		assertClassDecorator({ target, context });
		setInjectableMetadata({ target, metadata: options });
	};
}

/**
 * Creates a factory provider from a class marked with `@Injectable`.
 *
 * The returned provider is a normal di-craft factory provider, so scopes,
 * optional dependencies, disposal hooks, overrides, and cycle detection behave
 * the same as with `provideFactory`.
 */
export function provideInjectable<T>(
	target: InjectableClass<T>,
): FactoryProvider<T, DepsMap> {
	const metadata = getInjectableMetadata(target);

	if (!metadata) {
		const className = target.name || ANONYMOUS_CLASS_NAME;

		throw new InvalidProviderError(
			`Class "${className}" is not marked as injectable. Add @Injectable({ token: TOKEN }) before calling provideInjectable().`,
		);
	}

	const { deps = [], onDispose, scope, token } = metadata;
	const depsMap = tupleDepsToMap(deps);
	const Constructor = target as unknown as Constructable<T>;

	const useFactory = (resolvedDeps: ResolveDeps<DepsMap>): T => {
		const args = deps.map((_, index): unknown => resolvedDeps[String(index)]);

		return new Constructor(...args);
	};

	return provideFactory(token as Token<T>, {
		useFactory,
		...(depsMap ? { deps: depsMap } : {}),
		...(scope ? { scope } : {}),
		...(onDispose ? { onDispose: onDispose as DisposeHook<T> } : {}),
	});
}

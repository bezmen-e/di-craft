import type { InjectableClass, InjectableOptions } from "./types";

type InjectableMetadata = InjectableOptions<unknown>;

const injectableMetadata = new WeakMap<InjectableClass, InjectableMetadata>();

export const getInjectableMetadata = (
	target: InjectableClass,
): InjectableMetadata | undefined => injectableMetadata.get(target);

export const setInjectableMetadata = <T>(options: {
	readonly target: InjectableClass<T>;
	readonly metadata: InjectableOptions<T>;
}): void => {
	injectableMetadata.set(
		options.target,
		options.metadata as InjectableOptions<unknown>,
	);
};

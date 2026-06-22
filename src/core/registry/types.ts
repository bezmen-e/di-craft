import type { Provider } from "../provider";
import type { Token } from "../token";

/**
 * Options for provider registration.
 */
export type RegisterOptions = {
	/**
	 * Replace an existing provider for the same token.
	 *
	 * Overriding an already resolved disposable singleton is rejected to avoid
	 * dropping resources without running their cleanup hook.
	 */
	readonly allowOverride?: boolean;
};

export type Registry = {
	register(provider: Provider, options?: RegisterOptions): boolean;
	get(token: Token<unknown>): Provider | undefined;
	has(token: Token<unknown>): boolean;
};

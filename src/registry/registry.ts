import type { Provider } from "../provider";
import type { Token } from "../token";
import { DuplicateProviderError } from "./errors";
import type { RegisterOptions, Registry } from "./types";

class RegistryClass implements Registry {
	private readonly providers = new Map<symbol, Provider>();

	register(provider: Provider, options?: RegisterOptions): boolean {
		const existed = this.providers.has(provider.provide.id);

		if (existed && !options?.allowOverride) {
			throw new DuplicateProviderError(provider.provide.name);
		}

		this.providers.set(provider.provide.id, provider);

		// Returns whether an existing provider was actually replaced, so callers
		// can invalidate cached instances exactly when an override happened.
		return existed;
	}

	get(token: Token<unknown>): Provider | undefined {
		return this.providers.get(token.id);
	}

	has(token: Token<unknown>): boolean {
		return this.providers.has(token.id);
	}
}

export const createRegistry = (): Registry => new RegistryClass();

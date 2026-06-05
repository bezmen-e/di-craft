import type { Provider } from "../provider";
import type { Token } from "../token";
import { DuplicateProviderError } from "./errors";
import type { RegisterOptions, Registry } from "./types";

class RegistryClass implements Registry {
	private readonly providers = new Map<symbol, Provider>();

	register(provider: Provider, options?: RegisterOptions): void {
		const isDuplicate =
			!options?.allowOverride && this.providers.has(provider.provide.id);

		if (isDuplicate) {
			throw new DuplicateProviderError(provider.provide.name);
		}

		this.providers.set(provider.provide.id, provider);
	}

	get(token: Token<unknown>): Provider | undefined {
		return this.providers.get(token.id);
	}

	has(token: Token<unknown>): boolean {
		return this.providers.has(token.id);
	}
}

export const createRegistry = (): Registry => new RegistryClass();

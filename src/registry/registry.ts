import type { Provider } from "../provider";
import type { Token } from "../token";
import { DuplicateProviderError } from "./errors";
import type { Registry } from "./types";

class RegistryClass implements Registry {
	private readonly providers = new Map<symbol, Provider>();

	register(provider: Provider): void {
		if (this.providers.has(provider.provide.id)) {
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

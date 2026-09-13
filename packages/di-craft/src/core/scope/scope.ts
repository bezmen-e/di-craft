/**
 * Built-in provider lifetimes.
 */
export const Scopes = {
	Singleton: "singleton",
	Transient: "transient",
	Scoped: "scoped",
} as const;

/**
 * Provider lifetime.
 *
 * - `singleton`: one cached instance in the container that owns the provider.
 * - `scoped`: one cached instance in the container that resolves the provider.
 * - `transient`: a new instance for every resolution.
 */
export type Scope = (typeof Scopes)[keyof typeof Scopes];

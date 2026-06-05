export const Scopes = {
	Singleton: "singleton",
	Transient: "transient",
	Scoped: "scoped",
} as const;

export type Scope = (typeof Scopes)[keyof typeof Scopes];

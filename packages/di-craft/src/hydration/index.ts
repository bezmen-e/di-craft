/**
 * Framework-agnostic hydration primitives for server/client state snapshots.
 *
 * These helpers do not move a server container to the browser. They restore
 * explicit hydratable state into a separate client-safe container. Nothing in
 * this module imports a framework or runtime; adapters such as
 * `di-craft/next/client` and `di-craft/next/server` re-export the same helpers.
 *
 * @module
 */

export { dehydrate, hydrate } from "./hydration";
export type {
	DehydrateOptions,
	Hydratable,
	HydrateOptions,
	HydrationSchema,
	HydrationSnapshot,
	Serializable,
	SerializablePrimitive,
} from "./types";

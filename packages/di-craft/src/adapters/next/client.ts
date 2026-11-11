/**
 * Client-boundary helpers for restoring serializable state snapshots.
 *
 * These helpers do not move a server container to the browser. They restore
 * explicit hydratable state into a separate client-safe container. They live
 * in the framework-agnostic `di-craft/hydration` entry and are re-exported
 * here for Next.js client modules.
 *
 * @module
 */

export { hydrate } from "../../hydration";
export type {
	Hydratable,
	HydrateOptions,
	HydrationSchema,
	HydrationSnapshot,
	Serializable,
	SerializablePrimitive,
} from "./types";

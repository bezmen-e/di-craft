import type {
	DehydrateOptions,
	HydrateOptions,
	HydrationSchema,
	HydrationSnapshot,
	Serializable,
} from "./types";

/**
 * Reads serializable snapshots from hydratable entities declared in a schema.
 *
 * Use this on the server side before crossing into a Client Component. Only the
 * returned snapshot should cross the boundary, not the container or service
 * instances themselves.
 *
 * @example
 * ```ts
 * const hydration = { user: USER_STATE };
 * const snapshot = dehydrate({
 *   container: getRequestContainer(),
 *   schema: hydration,
 * });
 * ```
 */
export const dehydrate = <const TSchema extends HydrationSchema>(
	options: DehydrateOptions<TSchema>,
): HydrationSnapshot<TSchema> => {
	const snapshot: Record<string, Serializable> = {};

	for (const key of Object.keys(options.schema) as Array<keyof TSchema>) {
		const token = options.schema[key];
		const isMissingToken = token === undefined;
		const snapshotKey = String(key);

		if (isMissingToken) {
			throw new Error(`Missing hydration token for key "${snapshotKey}".`);
		}

		snapshot[snapshotKey] = options.container.get(token).dehydrate();
	}

	return snapshot as HydrationSnapshot<TSchema>;
};

/**
 * Restores serializable snapshots into hydratable entities declared in a schema.
 *
 * Use this with a client-safe container and the snapshot received through a
 * Client Component prop.
 *
 * @example
 * ```ts
 * hydrate({
 *   container: clientContainer,
 *   schema: hydration,
 *   snapshot,
 * });
 * ```
 */
export const hydrate = <const TSchema extends HydrationSchema>(
	options: HydrateOptions<TSchema>,
): void => {
	const snapshotRecord = options.snapshot as Record<
		string,
		Serializable | undefined
	>;

	for (const key of Object.keys(options.schema) as Array<keyof TSchema>) {
		const token = options.schema[key];
		const snapshotKey = String(key);
		const value = snapshotRecord[snapshotKey];

		const isMissingToken = token === undefined;
		const isMissingSnapshot = value === undefined;

		if (isMissingToken) {
			throw new Error(`Missing hydration token for key "${snapshotKey}".`);
		}

		if (isMissingSnapshot) {
			throw new Error(`Missing hydration snapshot for key "${snapshotKey}".`);
		}

		options.container.get(token).hydrate(value);
	}
};

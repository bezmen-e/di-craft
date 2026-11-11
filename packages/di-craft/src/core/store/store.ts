import type { Token } from "../token";
import type { InstanceRecord, Store } from "./types";

class StoreClass implements Store {
	// Created on first write so containers that never cache skip the allocation.
	private instances: Map<symbol, InstanceRecord> | undefined;

	get(token: Token<unknown>): InstanceRecord | undefined {
		return this.instances?.get(token.id);
	}

	set(token: Token<unknown>, record: InstanceRecord): void {
		this.instances ??= new Map();
		this.instances.set(token.id, record);
	}

	delete(token: Token<unknown>): void {
		this.instances?.delete(token.id);
	}

	async dispose(): Promise<void> {
		const instances = this.instances;

		if (!instances) {
			return;
		}

		// Snapshot and clear first so dispose() is idempotent and re-entrancy safe.
		const records = [...instances.values()].reverse();

		instances.clear();

		for (const record of records) {
			if (record.onDispose) {
				await record.onDispose(record.value);
			}
		}
	}
}

export const createStore = (): Store => new StoreClass();

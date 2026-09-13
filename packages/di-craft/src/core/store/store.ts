import type { Token } from "../token";
import type { InstanceRecord, Store } from "./types";

class StoreClass implements Store {
	private readonly instances = new Map<symbol, InstanceRecord>();

	get(token: Token<unknown>): InstanceRecord | undefined {
		return this.instances.get(token.id);
	}

	set(token: Token<unknown>, record: InstanceRecord): void {
		this.instances.set(token.id, record);
	}

	delete(token: Token<unknown>): void {
		this.instances.delete(token.id);
	}

	async dispose(): Promise<void> {
		// Snapshot and clear first so dispose() is idempotent and re-entrancy safe.
		const records = [...this.instances.values()].reverse();

		this.instances.clear();

		for (const record of records) {
			if (record.onDispose) {
				await record.onDispose(record.value);
			}
		}
	}
}

export const createStore = (): Store => new StoreClass();

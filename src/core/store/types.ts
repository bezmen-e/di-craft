import type { DisposeHook } from "../provider";
import type { Token } from "../token";

export type InstanceRecord = {
	readonly value: unknown;
	readonly onDispose?: DisposeHook<unknown>;
};

export type Store = {
	get(token: Token<unknown>): InstanceRecord | undefined;
	set(token: Token<unknown>, record: InstanceRecord): void;
	delete(token: Token<unknown>): void;
	dispose(): Promise<void>;
};

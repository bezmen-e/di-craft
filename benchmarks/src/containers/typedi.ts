import "reflect-metadata";
import { Container } from "typedi";
import * as F from "../fixtures/typedi.ts";
import type { ColdGraph, Resolver, ScopeHandle } from "./types.ts";

Container.set({
	id: F.ROOT_LOGGER_TOKEN,
	factory: () => Container.get(F.Logger),
	global: true,
});

let coldGraphId = 0;
let scopeId = 0;

function createColdGraph(): ColdGraph {
	const id = `cold-${coldGraphId++}`;
	const container = Container.of(id);
	return {
		resolveService: () => container.get(F.Service),
		release: () => {
			Container.reset(id);
		},
	};
}

export function buildRoot(): Resolver {
	return {
		teardown: "none",
		release: () => {
			Container.reset();
		},
		resolveLogger: () => Container.get(F.Logger),
		resolveConfig: () => Container.get(F.Config),
		resolveRepo: () => Container.get(F.Repo),
		resolveService: () => Container.get(F.Service),
		resolveTransient: () => Container.get(F.TransientService),
		resolveDeep: () => Container.get(F.L9),
		resolveWide4: () => Container.get(F.Wide4),
		resolveWide10: () => Container.get(F.Wide10),
		createColdGraph,
		createScope: (): ScopeHandle => {
			const id = `scope-${scopeId++}`;
			const scope = Container.of(id);
			scope.set({ id: "scoped", type: F.ScopedService });
			return {
				resolve: () => scope.get<F.ScopedService>("scoped"),
				release: () => {
					Container.reset(id);
				},
			};
		},
	};
}

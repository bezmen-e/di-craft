import { createInjector, Scope } from "typed-inject";
import * as F from "../fixtures/typed-inject.ts";
import type { ColdGraph, Resolver, ScopeHandle } from "./types.ts";

function configureRoot() {
	return createInjector()
		.provideClass("logger", F.Logger)
		.provideClass("config", F.Config)
		.provideClass("repo", F.Repo)
		.provideClass("service", F.Service)
		.provideClass("transient", F.TransientService, Scope.Transient)
		.provideClass("wide4", F.Wide4, Scope.Transient)
		.provideClass("dep0", F.Dep0)
		.provideClass("dep1", F.Dep1)
		.provideClass("dep2", F.Dep2)
		.provideClass("dep3", F.Dep3)
		.provideClass("dep4", F.Dep4)
		.provideClass("dep5", F.Dep5)
		.provideClass("dep6", F.Dep6)
		.provideClass("dep7", F.Dep7)
		.provideClass("dep8", F.Dep8)
		.provideClass("dep9", F.Dep9)
		.provideClass("wide10", F.Wide10, Scope.Transient)
		.provideClass("l0", F.L0, Scope.Transient)
		.provideClass("l1", F.L1, Scope.Transient)
		.provideClass("l2", F.L2, Scope.Transient)
		.provideClass("l3", F.L3, Scope.Transient)
		.provideClass("l4", F.L4, Scope.Transient)
		.provideClass("l5", F.L5, Scope.Transient)
		.provideClass("l6", F.L6, Scope.Transient)
		.provideClass("l7", F.L7, Scope.Transient)
		.provideClass("l8", F.L8, Scope.Transient)
		.provideClass("l9", F.L9, Scope.Transient);
}

function coldGraph(): ColdGraph {
	const container = configureRoot();
	return {
		resolveService: () => container.resolve("service"),
		release: () => container.dispose(),
	};
}

export function buildRoot(): Resolver {
	const root = configureRoot();
	return {
		teardown: "async",
		release: () => root.dispose(),
		resolveLogger: () => root.resolve("logger"),
		resolveConfig: () => root.resolve("config"),
		resolveRepo: () => root.resolve("repo"),
		resolveService: () => root.resolve("service"),
		resolveTransient: () => root.resolve("transient"),
		resolveDeep: () => root.resolve("l9"),
		resolveWide4: () => root.resolve("wide4"),
		resolveWide10: () => root.resolve("wide10"),
		registerGraph: coldGraph,
		createColdGraph: coldGraph,
		createScope: (): ScopeHandle => {
			const scope = root
				.createChildInjector()
				.provideClass("scoped", F.ScopedService);
			return {
				resolve: () => scope.resolve("scoped"),
				release: () => scope.dispose(),
				disposeAsync: () => scope.dispose(),
			};
		},
	};
}

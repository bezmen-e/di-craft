import "reflect-metadata";
import {
	type DependencyContainer,
	container as globalContainer,
	injectable,
	Lifecycle,
} from "tsyringe";
import * as F from "../fixtures/plain.ts";
import type { ColdGraph, Resolver, ScopeHandle } from "./types.ts";

// biome-ignore lint/suspicious/noExplicitAny: Decorator metadata accepts constructors with arbitrary parameters.
type Constructor<T = object> = new (...args: any[]) => T;

function registerType(
	target: Constructor,
	dependencies: readonly Constructor[],
): void {
	Reflect.defineMetadata("design:paramtypes", dependencies, target);
	injectable()(target);
}

registerType(F.Logger, []);
registerType(F.Config, []);
registerType(F.Repo, [F.Logger, F.Config]);
registerType(F.Service, [F.Repo, F.Logger]);
registerType(F.TransientService, [F.Repo, F.Logger]);
registerType(F.ScopedService, [F.Logger]);
registerType(F.Wide4, [F.Logger, F.Config, F.Repo, F.Service]);
registerType(F.Dep0, []);
registerType(F.Dep1, []);
registerType(F.Dep2, []);
registerType(F.Dep3, []);
registerType(F.Dep4, []);
registerType(F.Dep5, []);
registerType(F.Dep6, []);
registerType(F.Dep7, []);
registerType(F.Dep8, []);
registerType(F.Dep9, []);
registerType(F.Wide10, [
	F.Dep0,
	F.Dep1,
	F.Dep2,
	F.Dep3,
	F.Dep4,
	F.Dep5,
	F.Dep6,
	F.Dep7,
	F.Dep8,
	F.Dep9,
]);
registerType(F.L0, []);
registerType(F.L1, [F.L0]);
registerType(F.L2, [F.L1]);
registerType(F.L3, [F.L2]);
registerType(F.L4, [F.L3]);
registerType(F.L5, [F.L4]);
registerType(F.L6, [F.L5]);
registerType(F.L7, [F.L6]);
registerType(F.L8, [F.L7]);
registerType(F.L9, [F.L8]);

function configure(container: DependencyContainer): DependencyContainer {
	container.register(
		F.Logger,
		{ useClass: F.Logger },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.Config,
		{ useClass: F.Config },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.Repo,
		{ useClass: F.Repo },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.Service,
		{ useClass: F.Service },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.TransientService,
		{ useClass: F.TransientService },
		{ lifecycle: Lifecycle.Transient },
	);
	container.register(
		F.ScopedService,
		{ useClass: F.ScopedService },
		{ lifecycle: Lifecycle.ContainerScoped },
	);
	container.register(
		F.Wide4,
		{ useClass: F.Wide4 },
		{ lifecycle: Lifecycle.Transient },
	);
	container.register(
		F.Dep0,
		{ useClass: F.Dep0 },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.Dep1,
		{ useClass: F.Dep1 },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.Dep2,
		{ useClass: F.Dep2 },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.Dep3,
		{ useClass: F.Dep3 },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.Dep4,
		{ useClass: F.Dep4 },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.Dep5,
		{ useClass: F.Dep5 },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.Dep6,
		{ useClass: F.Dep6 },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.Dep7,
		{ useClass: F.Dep7 },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.Dep8,
		{ useClass: F.Dep8 },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.Dep9,
		{ useClass: F.Dep9 },
		{ lifecycle: Lifecycle.Singleton },
	);
	container.register(
		F.Wide10,
		{ useClass: F.Wide10 },
		{ lifecycle: Lifecycle.Transient },
	);
	container.register(
		F.L0,
		{ useClass: F.L0 },
		{ lifecycle: Lifecycle.Transient },
	);
	container.register(
		F.L1,
		{ useClass: F.L1 },
		{ lifecycle: Lifecycle.Transient },
	);
	container.register(
		F.L2,
		{ useClass: F.L2 },
		{ lifecycle: Lifecycle.Transient },
	);
	container.register(
		F.L3,
		{ useClass: F.L3 },
		{ lifecycle: Lifecycle.Transient },
	);
	container.register(
		F.L4,
		{ useClass: F.L4 },
		{ lifecycle: Lifecycle.Transient },
	);
	container.register(
		F.L5,
		{ useClass: F.L5 },
		{ lifecycle: Lifecycle.Transient },
	);
	container.register(
		F.L6,
		{ useClass: F.L6 },
		{ lifecycle: Lifecycle.Transient },
	);
	container.register(
		F.L7,
		{ useClass: F.L7 },
		{ lifecycle: Lifecycle.Transient },
	);
	container.register(
		F.L8,
		{ useClass: F.L8 },
		{ lifecycle: Lifecycle.Transient },
	);
	container.register(
		F.L9,
		{ useClass: F.L9 },
		{ lifecycle: Lifecycle.Transient },
	);
	return container;
}

function coldGraph(): ColdGraph {
	const container = configure(globalContainer.createChildContainer());
	return {
		resolveService: () => container.resolve(F.Service),
		release: () => container.dispose(),
	};
}

export function buildRoot(): Resolver {
	const root = configure(globalContainer.createChildContainer());
	return {
		teardown: "async",
		release: () => root.dispose(),
		resolveLogger: () => root.resolve(F.Logger),
		resolveConfig: () => root.resolve(F.Config),
		resolveRepo: () => root.resolve(F.Repo),
		resolveService: () => root.resolve(F.Service),
		resolveTransient: () => root.resolve(F.TransientService),
		resolveDeep: () => root.resolve(F.L9),
		resolveWide4: () => root.resolve(F.Wide4),
		resolveWide10: () => root.resolve(F.Wide10),
		registerGraph: coldGraph,
		createColdGraph: coldGraph,
		createScope: (): ScopeHandle => {
			const scope = root.createChildContainer();
			return {
				resolve: () => scope.resolve(F.ScopedService),
				release: () => scope.dispose(),
				disposeAsync: async () => {
					await scope.dispose();
				},
			};
		},
	};
}

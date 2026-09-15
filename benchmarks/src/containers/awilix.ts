import {
	type AwilixContainer,
	asClass,
	asFunction,
	createContainer,
	InjectionMode,
} from "awilix";
import * as F from "../fixtures/plain.ts";
import type { ColdGraph, Resolver, ScopeHandle } from "./types.ts";

// biome-ignore lint/suspicious/noExplicitAny: Awilix models its dynamic cradle with unconstrained values.
type Cradle = Record<string, any>;
type Container = AwilixContainer<Cradle>;

function configureProxy(): Container {
	const container = createContainer<Cradle>({
		injectionMode: InjectionMode.PROXY,
	});

	container.register({
		logger: asClass(F.Logger).singleton(),
		config: asClass(F.Config).singleton(),
		repo: asFunction(
			({ logger, config }) => new F.Repo(logger, config),
		).singleton(),
		service: asFunction(
			({ repo, logger }) => new F.Service(repo, logger),
		).singleton(),
		transient: asFunction(
			({ repo, logger }) => new F.TransientService(repo, logger),
		).transient(),
		scoped: asFunction(({ logger }) => new F.ScopedService(logger))
			.scoped()
			.disposer((value) => value.dispose()),
		wide4: asFunction(
			({ logger, config, repo, service }) =>
				new F.Wide4(logger, config, repo, service),
		).transient(),
		dep0: asClass(F.Dep0).singleton(),
		dep1: asClass(F.Dep1).singleton(),
		dep2: asClass(F.Dep2).singleton(),
		dep3: asClass(F.Dep3).singleton(),
		dep4: asClass(F.Dep4).singleton(),
		dep5: asClass(F.Dep5).singleton(),
		dep6: asClass(F.Dep6).singleton(),
		dep7: asClass(F.Dep7).singleton(),
		dep8: asClass(F.Dep8).singleton(),
		dep9: asClass(F.Dep9).singleton(),
		wide10: asFunction(
			({ dep0, dep1, dep2, dep3, dep4, dep5, dep6, dep7, dep8, dep9 }) =>
				new F.Wide10(
					dep0,
					dep1,
					dep2,
					dep3,
					dep4,
					dep5,
					dep6,
					dep7,
					dep8,
					dep9,
				),
		).transient(),
		l0: asClass(F.L0).transient(),
		l1: asFunction(({ l0 }) => new F.L1(l0)).transient(),
		l2: asFunction(({ l1 }) => new F.L2(l1)).transient(),
		l3: asFunction(({ l2 }) => new F.L3(l2)).transient(),
		l4: asFunction(({ l3 }) => new F.L4(l3)).transient(),
		l5: asFunction(({ l4 }) => new F.L5(l4)).transient(),
		l6: asFunction(({ l5 }) => new F.L6(l5)).transient(),
		l7: asFunction(({ l6 }) => new F.L7(l6)).transient(),
		l8: asFunction(({ l7 }) => new F.L8(l7)).transient(),
		l9: asFunction(({ l8 }) => new F.L9(l8)).transient(),
	});

	return container;
}

function configureClassic(): Container {
	const container = createContainer<Cradle>({
		injectionMode: InjectionMode.CLASSIC,
	});

	container.register({
		logger: asClass(F.Logger).singleton(),
		config: asClass(F.Config).singleton(),
		repo: asClass(F.Repo).singleton(),
		service: asClass(F.Service).singleton(),
		transient: asFunction(
			(repo, logger) => new F.TransientService(repo, logger),
		).transient(),
		scoped: asClass(F.ScopedService)
			.scoped()
			.disposer((value) => value.dispose()),
		wide4: asClass(F.Wide4).transient(),
		dep0: asClass(F.Dep0).singleton(),
		dep1: asClass(F.Dep1).singleton(),
		dep2: asClass(F.Dep2).singleton(),
		dep3: asClass(F.Dep3).singleton(),
		dep4: asClass(F.Dep4).singleton(),
		dep5: asClass(F.Dep5).singleton(),
		dep6: asClass(F.Dep6).singleton(),
		dep7: asClass(F.Dep7).singleton(),
		dep8: asClass(F.Dep8).singleton(),
		dep9: asClass(F.Dep9).singleton(),
		wide10: asClass(F.Wide10).transient(),
		l0: asClass(F.L0).transient(),
		l1: asClass(F.L1).transient(),
		l2: asClass(F.L2).transient(),
		l3: asClass(F.L3).transient(),
		l4: asClass(F.L4).transient(),
		l5: asClass(F.L5).transient(),
		l6: asClass(F.L6).transient(),
		l7: asClass(F.L7).transient(),
		l8: asClass(F.L8).transient(),
		l9: asClass(F.L9).transient(),
	});

	return container;
}

function coldGraph(configure: () => Container): ColdGraph {
	const container = configure();
	return {
		resolveService: () => container.cradle.service,
		release: () => container.dispose(),
	};
}

function makeResolver(root: Container, configure: () => Container): Resolver {
	return {
		teardown: "async",
		release: () => root.dispose(),
		resolveLogger: () => root.cradle.logger,
		resolveConfig: () => root.cradle.config,
		resolveRepo: () => root.cradle.repo,
		resolveService: () => root.cradle.service,
		resolveTransient: () => root.cradle.transient,
		resolveDeep: () => root.cradle.l9,
		resolveWide4: () => root.cradle.wide4,
		resolveWide10: () => root.cradle.wide10,
		registerGraph: () => coldGraph(configure),
		createColdGraph: () => coldGraph(configure),
		createScope: (): ScopeHandle => {
			const scope = root.createScope();
			return {
				resolve: () => scope.cradle.scoped,
				release: () => scope.dispose(),
				disposeAsync: () => scope.dispose(),
			};
		},
	};
}

export function buildRootProxy(): Resolver {
	return makeResolver(configureProxy(), configureProxy);
}

export function buildRootClassic(): Resolver {
	return makeResolver(configureClassic(), configureClassic);
}

import { Container } from "inversify";
import * as F from "../fixtures/plain.ts";
import type { ColdGraph, Resolver, ScopeHandle } from "./types.ts";

const T = {
	logger: Symbol("logger"),
	config: Symbol("config"),
	repo: Symbol("repo"),
	service: Symbol("service"),
	transient: Symbol("transient"),
	scoped: Symbol("scoped"),
	wide4: Symbol("wide4"),
	wide10: Symbol("wide10"),
	deps: [
		Symbol("dep0"),
		Symbol("dep1"),
		Symbol("dep2"),
		Symbol("dep3"),
		Symbol("dep4"),
		Symbol("dep5"),
		Symbol("dep6"),
		Symbol("dep7"),
		Symbol("dep8"),
		Symbol("dep9"),
	] as const,
	levels: [
		Symbol("l0"),
		Symbol("l1"),
		Symbol("l2"),
		Symbol("l3"),
		Symbol("l4"),
		Symbol("l5"),
		Symbol("l6"),
		Symbol("l7"),
		Symbol("l8"),
		Symbol("l9"),
	] as const,
};

function configureRoot(): Container {
	const container = new Container();
	container
		.bind<F.Logger>(T.logger)
		.toDynamicValue(() => new F.Logger())
		.inSingletonScope();
	container
		.bind<F.Config>(T.config)
		.toDynamicValue(() => new F.Config())
		.inSingletonScope();
	container
		.bind<F.Repo>(T.repo)
		.toDynamicValue(({ get }) => new F.Repo(get(T.logger), get(T.config)))
		.inSingletonScope();
	container
		.bind<F.Service>(T.service)
		.toDynamicValue(({ get }) => new F.Service(get(T.repo), get(T.logger)))
		.inSingletonScope();
	container
		.bind<F.TransientService>(T.transient)
		.toDynamicValue(
			({ get }) => new F.TransientService(get(T.repo), get(T.logger)),
		);
	container
		.bind<F.Wide4>(T.wide4)
		.toDynamicValue(
			({ get }) =>
				new F.Wide4(get(T.logger), get(T.config), get(T.repo), get(T.service)),
		);

	const dependencyBindings = [
		[T.deps[0], F.Dep0],
		[T.deps[1], F.Dep1],
		[T.deps[2], F.Dep2],
		[T.deps[3], F.Dep3],
		[T.deps[4], F.Dep4],
		[T.deps[5], F.Dep5],
		[T.deps[6], F.Dep6],
		[T.deps[7], F.Dep7],
		[T.deps[8], F.Dep8],
		[T.deps[9], F.Dep9],
	] as const;
	for (const [token, Dependency] of dependencyBindings) {
		container
			.bind(token)
			.toDynamicValue(() => new Dependency())
			.inSingletonScope();
	}
	container
		.bind<F.Wide10>(T.wide10)
		.toDynamicValue(
			({ get }) =>
				new F.Wide10(
					get(T.deps[0]),
					get(T.deps[1]),
					get(T.deps[2]),
					get(T.deps[3]),
					get(T.deps[4]),
					get(T.deps[5]),
					get(T.deps[6]),
					get(T.deps[7]),
					get(T.deps[8]),
					get(T.deps[9]),
				),
		);

	container.bind<F.L0>(T.levels[0]).toDynamicValue(() => new F.L0());
	container
		.bind<F.L1>(T.levels[1])
		.toDynamicValue(({ get }) => new F.L1(get(T.levels[0])));
	container
		.bind<F.L2>(T.levels[2])
		.toDynamicValue(({ get }) => new F.L2(get(T.levels[1])));
	container
		.bind<F.L3>(T.levels[3])
		.toDynamicValue(({ get }) => new F.L3(get(T.levels[2])));
	container
		.bind<F.L4>(T.levels[4])
		.toDynamicValue(({ get }) => new F.L4(get(T.levels[3])));
	container
		.bind<F.L5>(T.levels[5])
		.toDynamicValue(({ get }) => new F.L5(get(T.levels[4])));
	container
		.bind<F.L6>(T.levels[6])
		.toDynamicValue(({ get }) => new F.L6(get(T.levels[5])));
	container
		.bind<F.L7>(T.levels[7])
		.toDynamicValue(({ get }) => new F.L7(get(T.levels[6])));
	container
		.bind<F.L8>(T.levels[8])
		.toDynamicValue(({ get }) => new F.L8(get(T.levels[7])));
	container
		.bind<F.L9>(T.levels[9])
		.toDynamicValue(({ get }) => new F.L9(get(T.levels[8])));
	return container;
}

function coldGraph(): ColdGraph {
	const container = configureRoot();
	return {
		resolveService: () => container.get<F.Service>(T.service),
		release: () => container.unbindAll(),
	};
}

export function buildRoot(): Resolver {
	const root = configureRoot();
	return {
		teardown: "none",
		requiresCleanupTurn: true,
		release: () => root.unbindAll(),
		resolveLogger: () => root.get(T.logger),
		resolveConfig: () => root.get(T.config),
		resolveRepo: () => root.get(T.repo),
		resolveService: () => root.get(T.service),
		resolveTransient: () => root.get(T.transient),
		resolveDeep: () => root.get(T.levels[9]),
		resolveWide4: () => root.get(T.wide4),
		resolveWide10: () => root.get(T.wide10),
		registerGraph: coldGraph,
		createColdGraph: coldGraph,
		createScope: (): ScopeHandle => {
			const scope = new Container({ parent: root });
			scope
				.bind<F.ScopedService>(T.scoped)
				.toDynamicValue(({ get }) => new F.ScopedService(get(T.logger)))
				.inSingletonScope();
			return {
				resolve: () => scope.get(T.scoped),
				release: () => scope.unbindAll(),
			};
		},
	};
}

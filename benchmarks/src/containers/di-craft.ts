import {
	createChildContainer,
	createContainer,
	createToken,
	type Provider,
	provideFactory,
	Scopes,
} from "di-craft";
import * as F from "../fixtures/plain.ts";
import type { ColdGraph, Resolver, ScopeHandle } from "./types.ts";

const T = {
	logger: createToken<F.Logger>("logger"),
	config: createToken<F.Config>("config"),
	repo: createToken<F.Repo>("repo"),
	service: createToken<F.Service>("service"),
	transient: createToken<F.TransientService>("transient"),
	scoped: createToken<F.ScopedService>("scoped"),
	wide4: createToken<F.Wide4>("wide4"),
	wide10: createToken<F.Wide10>("wide10"),
	dep0: createToken<F.Dep0>("dep0"),
	dep1: createToken<F.Dep1>("dep1"),
	dep2: createToken<F.Dep2>("dep2"),
	dep3: createToken<F.Dep3>("dep3"),
	dep4: createToken<F.Dep4>("dep4"),
	dep5: createToken<F.Dep5>("dep5"),
	dep6: createToken<F.Dep6>("dep6"),
	dep7: createToken<F.Dep7>("dep7"),
	dep8: createToken<F.Dep8>("dep8"),
	dep9: createToken<F.Dep9>("dep9"),
	l0: createToken<F.L0>("l0"),
	l1: createToken<F.L1>("l1"),
	l2: createToken<F.L2>("l2"),
	l3: createToken<F.L3>("l3"),
	l4: createToken<F.L4>("l4"),
	l5: createToken<F.L5>("l5"),
	l6: createToken<F.L6>("l6"),
	l7: createToken<F.L7>("l7"),
	l8: createToken<F.L8>("l8"),
	l9: createToken<F.L9>("l9"),
};

function graphProviders(): Provider[] {
	return [
		provideFactory(T.logger, { useFactory: () => new F.Logger() }),
		provideFactory(T.config, { useFactory: () => new F.Config() }),
		provideFactory(T.repo, {
			deps: { logger: T.logger, config: T.config },
			useFactory: ({ logger, config }) => new F.Repo(logger, config),
		}),
		provideFactory(T.service, {
			deps: { repo: T.repo, logger: T.logger },
			useFactory: ({ repo, logger }) => new F.Service(repo, logger),
		}),
		provideFactory(T.transient, {
			deps: { repo: T.repo, logger: T.logger },
			scope: Scopes.Transient,
			useFactory: ({ repo, logger }) => new F.TransientService(repo, logger),
		}),
		provideFactory(T.scoped, {
			deps: { logger: T.logger },
			scope: Scopes.Scoped,
			useFactory: ({ logger }) => new F.ScopedService(logger),
			onDispose: (value) => value.dispose(),
		}),
		provideFactory(T.wide4, {
			deps: {
				logger: T.logger,
				config: T.config,
				repo: T.repo,
				service: T.service,
			},
			scope: Scopes.Transient,
			useFactory: ({ logger, config, repo, service }) =>
				new F.Wide4(logger, config, repo, service),
		}),
		provideFactory(T.dep0, { useFactory: () => new F.Dep0() }),
		provideFactory(T.dep1, { useFactory: () => new F.Dep1() }),
		provideFactory(T.dep2, { useFactory: () => new F.Dep2() }),
		provideFactory(T.dep3, { useFactory: () => new F.Dep3() }),
		provideFactory(T.dep4, { useFactory: () => new F.Dep4() }),
		provideFactory(T.dep5, { useFactory: () => new F.Dep5() }),
		provideFactory(T.dep6, { useFactory: () => new F.Dep6() }),
		provideFactory(T.dep7, { useFactory: () => new F.Dep7() }),
		provideFactory(T.dep8, { useFactory: () => new F.Dep8() }),
		provideFactory(T.dep9, { useFactory: () => new F.Dep9() }),
		provideFactory(T.wide10, {
			deps: {
				dep0: T.dep0,
				dep1: T.dep1,
				dep2: T.dep2,
				dep3: T.dep3,
				dep4: T.dep4,
				dep5: T.dep5,
				dep6: T.dep6,
				dep7: T.dep7,
				dep8: T.dep8,
				dep9: T.dep9,
			},
			scope: Scopes.Transient,
			useFactory: ({
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
			}) =>
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
		}),
		provideFactory(T.l0, {
			scope: Scopes.Transient,
			useFactory: () => new F.L0(),
		}),
		provideFactory(T.l1, {
			deps: { l0: T.l0 },
			scope: Scopes.Transient,
			useFactory: ({ l0 }) => new F.L1(l0),
		}),
		provideFactory(T.l2, {
			deps: { l1: T.l1 },
			scope: Scopes.Transient,
			useFactory: ({ l1 }) => new F.L2(l1),
		}),
		provideFactory(T.l3, {
			deps: { l2: T.l2 },
			scope: Scopes.Transient,
			useFactory: ({ l2 }) => new F.L3(l2),
		}),
		provideFactory(T.l4, {
			deps: { l3: T.l3 },
			scope: Scopes.Transient,
			useFactory: ({ l3 }) => new F.L4(l3),
		}),
		provideFactory(T.l5, {
			deps: { l4: T.l4 },
			scope: Scopes.Transient,
			useFactory: ({ l4 }) => new F.L5(l4),
		}),
		provideFactory(T.l6, {
			deps: { l5: T.l5 },
			scope: Scopes.Transient,
			useFactory: ({ l5 }) => new F.L6(l5),
		}),
		provideFactory(T.l7, {
			deps: { l6: T.l6 },
			scope: Scopes.Transient,
			useFactory: ({ l6 }) => new F.L7(l6),
		}),
		provideFactory(T.l8, {
			deps: { l7: T.l7 },
			scope: Scopes.Transient,
			useFactory: ({ l7 }) => new F.L8(l7),
		}),
		provideFactory(T.l9, {
			deps: { l8: T.l8 },
			scope: Scopes.Transient,
			useFactory: ({ l8 }) => new F.L9(l8),
		}),
	];
}

function coldGraph(): ColdGraph {
	const container = createContainer(graphProviders());

	return {
		resolveService: () => container.get(T.service),
		release: () => container.dispose(),
	};
}

export function buildRoot(): Resolver {
	const root = createContainer(graphProviders());

	return {
		teardown: "async",
		release: () => root.dispose(),
		resolveLogger: () => root.get(T.logger),
		resolveConfig: () => root.get(T.config),
		resolveRepo: () => root.get(T.repo),
		resolveService: () => root.get(T.service),
		resolveTransient: () => root.get(T.transient),
		resolveDeep: () => root.get(T.l9),
		resolveWide4: () => root.get(T.wide4),
		resolveWide10: () => root.get(T.wide10),
		registerGraph: coldGraph,
		createColdGraph: coldGraph,
		createScope: (): ScopeHandle => {
			const scope = createChildContainer(root);

			return {
				resolve: () => scope.get(T.scoped),
				release: () => scope.dispose(),
				disposeAsync: () => scope.dispose(),
			};
		},
	};
}

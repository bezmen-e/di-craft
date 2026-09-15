import { describe, expect, test } from "bun:test";
import { subjects } from "../containers/subjects.ts";
import type {
	DeepValue,
	Resolver,
	ScopeHandle,
	ServiceValue,
} from "../containers/types.ts";

function expectServiceGraph(resolver: Resolver, service: ServiceValue): void {
	const logger = resolver.resolveLogger();
	const config = resolver.resolveConfig();
	const repo = resolver.resolveRepo();

	expect(service.logger).toBe(logger);
	expect(service.repo).toBe(repo);
	expect(repo.logger).toBe(logger);
	expect(repo.config).toBe(config);
}

function deepNodes(value: DeepValue): object[] {
	const l8 = value.l8;
	const l7 = l8.l7;
	const l6 = l7.l6;
	const l5 = l6.l5;
	const l4 = l5.l4;
	const l3 = l4.l3;
	const l2 = l3.l2;
	const l1 = l2.l1;
	return [value, l8, l7, l6, l5, l4, l3, l2, l1, l1.l0];
}

function wide10Dependencies(resolver: Resolver): object[] {
	const value = resolver.resolveWide10();
	return [
		value.dep0,
		value.dep1,
		value.dep2,
		value.dep3,
		value.dep4,
		value.dep5,
		value.dep6,
		value.dep7,
		value.dep8,
		value.dep9,
	];
}

async function releaseScope(scope: ScopeHandle): Promise<void> {
	await scope.release();
}

for (const subject of subjects) {
	describe(`adapter contract: ${subject.name}`, () => {
		test("preserves identities, graph shape, scopes, and capabilities", async () => {
			const resolver = subject.build();
			try {
				const service = resolver.resolveService();
				const transientA = resolver.resolveTransient();
				const transientB = resolver.resolveTransient();

				expect(resolver.resolveService()).toBe(service);
				expectServiceGraph(resolver, service);
				expect(transientA).not.toBe(transientB);
				expect(transientA.repo).toBe(service.repo);
				expect(transientB.repo).toBe(service.repo);

				const deepA = deepNodes(resolver.resolveDeep());
				const deepB = deepNodes(resolver.resolveDeep());
				expect(deepA).toHaveLength(10);
				for (let index = 0; index < deepA.length; index += 1) {
					expect(deepA[index]).not.toBe(deepB[index]);
				}

				const wide4A = resolver.resolveWide4();
				const wide4B = resolver.resolveWide4();
				expect(wide4A).not.toBe(wide4B);
				expect(wide4A.logger).toBe(resolver.resolveLogger());
				expect(wide4A.config).toBe(resolver.resolveConfig());
				expect(wide4A.repo).toBe(resolver.resolveRepo());
				expect(wide4A.service).toBe(resolver.resolveService());

				const wide10A = wide10Dependencies(resolver);
				const wide10B = wide10Dependencies(resolver);
				for (let index = 0; index < wide10A.length; index += 1) {
					expect(wide10A[index]).toBe(wide10B[index]);
				}

				const coldA = resolver.createColdGraph();
				const coldB = resolver.createColdGraph();
				try {
					const serviceA = coldA.resolveService();
					const serviceB = coldB.resolveService();
					expect(coldA.resolveService()).toBe(serviceA);
					expect(coldB.resolveService()).toBe(serviceB);
					expect(serviceA).not.toBe(serviceB);
					expect(serviceA.repo).not.toBe(serviceB.repo);
					expect(serviceA.logger).toBe(serviceA.repo.logger);
					expect(serviceB.logger).toBe(serviceB.repo.logger);
				} finally {
					await coldA.release();
					await coldB.release();
				}

				if (resolver.registerGraph) {
					const registered = resolver.registerGraph();
					try {
						const registeredService = registered.resolveService();
						expect(registered.resolveService()).toBe(registeredService);
					} finally {
						await registered.release();
					}
				} else {
					expect(subject.name).toBe("TypeDI");
				}

				const rootLogger = resolver.resolveLogger();
				const scopeA = resolver.createScope();
				const scopeB = resolver.createScope();
				try {
					const scopedA = scopeA.resolve();
					const scopedB = scopeB.resolve();
					expect(scopeA.resolve()).toBe(scopedA);
					expect(scopeB.resolve()).toBe(scopedB);
					expect(scopedA).not.toBe(scopedB);
					expect(scopedA.logger).toBe(rootLogger);
					expect(scopedB.logger).toBe(rootLogger);
				} finally {
					await releaseScope(scopeA);
					await releaseScope(scopeB);
				}

				if (resolver.teardown === "async") {
					const scope = resolver.createScope();
					const value = scope.resolve();
					expect(scope.disposeAsync).toBeTypeOf("function");
					expect(value.disposeCount).toBe(0);
					await scope.disposeAsync?.();
					expect(value.disposeCount).toBe(1);
				} else {
					const scope = resolver.createScope();
					try {
						expect(scope.disposeAsync).toBeUndefined();
					} finally {
						await scope.release();
					}
				}
			} finally {
				await resolver.release();
			}
		});
	});
}

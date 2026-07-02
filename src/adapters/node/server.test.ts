import { describe, expect, test } from "bun:test";
import { createToken, provideFactory, provideValue, Scopes } from "../../index";
import { NodeRequestScopeError } from "./errors";
import { createNodeDi } from "./server";

describe("node/server", () => {
	test("creates a root container with root providers", () => {
		const CONFIG = createToken<{ readonly baseUrl: string }>("CONFIG");

		const di = createNodeDi({
			providers: [provideValue(CONFIG, { baseUrl: "https://example.com" })],
		});

		expect(di.getRootContainer().get(CONFIG)).toEqual({
			baseUrl: "https://example.com",
		});
	});

	test("throws when request container is read outside async scope", () => {
		const di = createNodeDi();

		expect(() => di.getRequestContainer()).toThrow(NodeRequestScopeError);
	});

	test("returns current request container inside async scope", async () => {
		const REQUEST_ID = createToken<number>("REQUEST_ID");
		const di = createNodeDi();

		await di.runWithRequestContainer({
			providers: [provideValue(REQUEST_ID, 1)],
			run: async (container) => {
				expect(di.getRequestContainer()).toBe(container);
				expect(di.getRequestContainer().get(REQUEST_ID)).toBe(1);
			},
		});
	});

	test("clears current request container after async scope settles", async () => {
		const di = createNodeDi();

		await di.runWithRequestContainer({
			run: async () => {
				di.getRequestContainer();
			},
		});

		expect(() => di.getRequestContainer()).toThrow(NodeRequestScopeError);
	});

	test("keeps async request scopes isolated", async () => {
		const REQUEST_ID = createToken<number>("REQUEST_ID");
		const di = createNodeDi();

		const [first, second] = await Promise.all([
			di.runWithRequestContainer({
				providers: [provideValue(REQUEST_ID, 1)],
				run: async () => {
					await Promise.resolve();

					return di.getRequestContainer().get(REQUEST_ID);
				},
			}),
			di.runWithRequestContainer({
				providers: [provideValue(REQUEST_ID, 2)],
				run: async () => {
					await Promise.resolve();

					return di.getRequestContainer().get(REQUEST_ID);
				},
			}),
		]);

		expect(first).toBe(1);
		expect(second).toBe(2);
	});

	test("registers request providers in each async scope", async () => {
		const REQUEST_ID = createToken<number>("REQUEST_ID");

		let calls = 0;
		const di = createNodeDi({
			requestProviders: () => {
				calls += 1;

				return [provideValue(REQUEST_ID, calls)];
			},
		});

		const first = await di.runWithRequestContainer({
			run: async () => di.getRequestContainer().get(REQUEST_ID),
		});
		const second = await di.runWithRequestContainer({
			run: async () => di.getRequestContainer().get(REQUEST_ID),
		});

		expect(first).toBe(1);
		expect(second).toBe(2);
		expect(calls).toBe(2);
	});

	test("disposes request container after success", async () => {
		const RESOURCE = createToken<{ readonly id: number }>("RESOURCE");

		const disposed: number[] = [];
		const di = createNodeDi({
			providers: [
				provideFactory(RESOURCE, {
					scope: Scopes.Scoped,
					useFactory: () => ({ id: 1 }),
					onDispose: (resource) => {
						disposed.push(resource.id);
					},
				}),
			],
		});

		await di.runWithRequestContainer({
			run: async (container) => {
				container.get(RESOURCE);
			},
		});

		expect(disposed).toEqual([1]);
	});

	test("keeps async scope active while disposing request container", async () => {
		const REQUEST_ID = createToken<number>("REQUEST_ID");
		const RESOURCE = createToken<{ readonly id: number }>("RESOURCE");

		const disposedRequestIds: number[] = [];
		const di = createNodeDi({
			providers: [
				provideFactory(RESOURCE, {
					scope: Scopes.Scoped,
					useFactory: () => ({ id: 1 }),
					onDispose: () => {
						disposedRequestIds.push(di.getRequestContainer().get(REQUEST_ID));
					},
				}),
			],
		});

		await di.runWithRequestContainer({
			providers: [provideValue(REQUEST_ID, 1)],
			run: async (container) => {
				container.get(RESOURCE);
			},
		});

		expect(disposedRequestIds).toEqual([1]);
	});

	test("disposes request container after failure", async () => {
		const RESOURCE = createToken<{ readonly id: number }>("RESOURCE");

		const disposed: number[] = [];
		const di = createNodeDi({
			providers: [
				provideFactory(RESOURCE, {
					scope: Scopes.Scoped,
					useFactory: () => ({ id: 1 }),
					onDispose: (resource) => {
						disposed.push(resource.id);
					},
				}),
			],
		});

		await expect(
			di.runWithRequestContainer({
				run: async (container) => {
					container.get(RESOURCE);

					throw new Error("Request failed.");
				},
			}),
		).rejects.toThrow("Request failed.");
		expect(disposed).toEqual([1]);
	});
});

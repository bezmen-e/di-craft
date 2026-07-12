import { createToken, provideFactory, provideValue, Scopes } from "di-craft";
import { createNodeDi } from "di-craft/node";

type TenantContext = {
	readonly tenantId: string;
};

class TenantDatabase {
	readonly tenantId: string;
	closed = false;

	constructor(tenantId: string) {
		this.tenantId = tenantId;
	}

	createPost(title: string): string {
		return `${this.tenantId}:${title}`;
	}

	close(): void {
		this.closed = true;
	}
}

class PostsService {
	private readonly db: TenantDatabase;

	constructor(db: TenantDatabase) {
		this.db = db;
	}

	create(title: string): string {
		return this.db.createPost(title);
	}
}

const TENANT_CONTEXT = createToken<TenantContext>("TENANT_CONTEXT");
const TENANT_DB = createToken<TenantDatabase>("TENANT_DB");
const POSTS_SERVICE = createToken<PostsService>("POSTS_SERVICE");

const disposedTenants: string[] = [];

const { getRequestContainer, runWithRequestContainer } = createNodeDi({
	providers: [
		provideFactory(TENANT_DB, {
			scope: Scopes.Scoped,
			deps: { tenant: TENANT_CONTEXT },
			useFactory: ({ tenant }) => new TenantDatabase(tenant.tenantId),
			onDispose: (db) => {
				db.close();
				disposedTenants.push(db.tenantId);
			},
		}),
		provideFactory(POSTS_SERVICE, {
			scope: Scopes.Scoped,
			deps: { db: TENANT_DB },
			useFactory: ({ db }) => new PostsService(db),
		}),
	],
});

const getPosts = (): PostsService => {
	return getRequestContainer().get(POSTS_SERVICE);
};

const createPostFromDeepCode = async (title: string): Promise<string> => {
	await Promise.resolve();

	return getPosts().create(title);
};

const resolveTenant = (request: Request): string => {
	return request.headers.get("x-tenant-id") ?? "public";
};

export const POST = async (request: Request): Promise<Response> => {
	const tenantId = resolveTenant(request);

	return runWithRequestContainer({
		providers: [provideValue(TENANT_CONTEXT, { tenantId })],
		run: async () => {
			const created = await createPostFromDeepCode("from-route");

			return Response.json({ created });
		},
	});
};

export const createPostAction = async (formData: FormData): Promise<string> => {
	"use server";

	const tenantId = String(formData.get("tenantId") ?? "public");
	const title = String(formData.get("title") ?? "untitled");

	return runWithRequestContainer({
		providers: [provideValue(TENANT_CONTEXT, { tenantId })],
		run: async () => createPostFromDeepCode(title),
	});
};

const formData = new FormData();
formData.set("tenantId", "tenant-action");
formData.set("title", "from-action");

const routeResponse = await POST(
	new Request("https://example.com/posts", {
		headers: { "x-tenant-id": "tenant-route" },
	}),
);
const actionResult = await createPostAction(formData);

type DemoResult = {
	readonly actionResult: string;
	readonly disposedTenants: readonly string[];
	readonly routeOk: boolean;
};

export const demoResult: DemoResult = {
	actionResult: actionResult,
	disposedTenants: disposedTenants,
	routeOk: routeResponse.ok,
};

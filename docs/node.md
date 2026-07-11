# Node.js Async Context Adapter

The Node adapter provides explicit async request scopes with
`AsyncLocalStorage`.

Use it when you want request-local DI in Node code outside the React Server
Components render tree:

- Route Handlers;
- Server Actions with nested async code that should read request context without
  passing the container through every function;
- middleware-like server code;
- jobs and custom server entrypoints;
- code where passing the container through every function would be noisy.

For React Server Components in Next.js, keep using `di-craft/next/server` with
React's `cache` primitive when you only need RSC render scope. Use this adapter
for Node runtime entrypoints when nested async code should read the current
request container without receiving it as an argument.

## Runtime

This adapter is Node.js-only because it imports `node:async_hooks`. It is not
intended for Edge runtimes.

For Edge or other runtimes without `AsyncLocalStorage`, pass the container
explicitly or use a callback helper that owns the request lifecycle.

## Imports

```ts
import { createNodeDi } from "di-craft/node";
```

## Basic Usage

```ts
import { createToken, provideFactory, provideValue, Scopes } from "di-craft";
import { createNodeDi } from "di-craft/node";

const REQUEST_ID = createToken<string>("REQUEST_ID");
const USERS_SERVICE = createToken<UsersService>("USERS_SERVICE");

const { getRequestContainer, runWithRequestContainer } = createNodeDi({
  providers: [
    provideFactory(USERS_SERVICE, {
      scope: Scopes.Scoped,
      deps: { requestId: REQUEST_ID },
      useFactory: ({ requestId }) => new UsersService(requestId),
    }),
  ],
});

await runWithRequestContainer({
  providers: [provideValue(REQUEST_ID, crypto.randomUUID())],
  run: async () => {
    const users = getRequestContainer().get(USERS_SERVICE);

    return users.list();
  },
});
```

`getRequestContainer()` works only inside `runWithRequestContainer()`. Calling it
outside an active async scope throws a clear error.

Await every async operation that reads the request container before the callback
returns. Async work started inside the scope can keep the `AsyncLocalStorage`
store, but `runWithRequestContainer()` disposes the request container as soon as
the callback settles.

## Relationship With Next.js

`di-craft/node` and `di-craft/next/server` solve different scope boundaries:

| Boundary                         | Adapter                  | Primitive           |
| -------------------------------- | ------------------------ | ------------------- |
| Server Components / nested RSC   | `di-craft/next/server`   | React `cache`       |
| Explicit Node async scopes       | `di-craft/node`          | `AsyncLocalStorage` |
| Simple Route Handlers / Actions  | Either explicit helper   | Callback scope      |
| Browser / Client Components      | Neither server container | Serializable state  |

`AsyncLocalStorage` does not magically make a Page/RSC render container equal to
a later Server Action container. It gives you a request container inside an
explicit async scope that you create with `runWithRequestContainer()`.

For simple Next.js Route Handlers and Server Actions, `runWithRequestContainer`
from `di-craft/next/server` is usually enough. Reach for `di-craft/node` when
nested Node async calls need to read the current request container with
`getRequestContainer()`.

That distinction matters in multi-tenant or resource-heavy entrypoints:

```ts
export async function POST(request: Request) {
  const tenantId = request.headers.get("x-tenant-id") ?? "public";

  return runWithRequestContainer({
    providers: [provideValue(TENANT_ID, tenantId)],
    run: async () => {
      return createPostFromDeepCode();
    },
  });
}

const createPostFromDeepCode = async () => {
  const posts = getRequestContainer().get(POSTS_SERVICE);

  return posts.create();
};
```

The typed Next Node runtime example shows the entrypoint wrapper and deep
`getRequestContainer()` pattern:
[next-runtime-als.ts](../examples/typed-docs/node/next-runtime-als.ts).

Use `React.cache()` separately for RSC-only dedupe while `AsyncLocalStorage`
owns request/tenant context and disposal.

## Disposal

`runWithRequestContainer()` disposes the request container after the callback
settles, even when the callback throws:

```ts
await runWithRequestContainer({
  run: async (container) => {
    container.get(DB_CONNECTION);
  },
});
```

Use `onDispose` on cached providers to release resources.

Do not start detached async work that later calls `getRequestContainer()` from
inside the callback. Pass the plain data it needs, or await that work before the
callback returns, so it does not read from a disposed request container.

Next.js post-action work, such as callbacks scheduled after a Server Action,
may run outside the async scope that created the request container. Re-enter a
new scope or pass plain values to that work instead of calling
`getRequestContainer()` after disposal.

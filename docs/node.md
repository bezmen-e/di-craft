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
React's `cache` primitive.

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

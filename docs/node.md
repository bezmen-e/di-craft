# Node.js Async Context Adapter

The Node adapter provides explicit async request scopes with
`AsyncLocalStorage`.

Use it when you want request-local DI in Node code outside the React Server
Components render tree:

- Route Handlers;
- Server Actions;
- middleware-like server code;
- jobs and custom server entrypoints;
- code where passing the container through every function would be noisy.

For React Server Components in Next.js, keep using `di-craft/next/server` with
React's `cache` primitive.

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
| Route Handlers / Server Actions  | Either explicit helper   | Depends on setup    |
| Browser / Client Components      | Neither server container | Serializable state  |

`AsyncLocalStorage` does not magically make a Page/RSC render container equal to
a later Server Action container. It gives you a request container inside an
explicit async scope that you create with `runWithRequestContainer()`.

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

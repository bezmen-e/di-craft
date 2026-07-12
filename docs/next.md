# Next.js App Router Adapter

The Next.js adapter connects `di-craft` to the App Router and React Server
Components lifecycle without making React or Next.js part of the core package.

Use it when you want:

- one root container on the server;
- one child container per RSC render;
- scoped dependencies that live inside that render container;
- explicit server-to-client state snapshots;
- no server DI container hydration in the browser.

## Imports

The adapter is split by runtime boundary:

```ts
import { createNextDi, dehydrate } from "di-craft/next/server";
import { hydrate } from "di-craft/next/client";
```

Shared hydration types such as `Hydratable`, `HydrationSchema`, and
`HydrationSnapshot` are exported from both subpaths for convenience.

## Server Composition

Create the adapter in a server-only composition file. Pass React's `cache`
function so React/Next owns request memoization while `di-craft` owns the
dependency graph.

```ts
// app/di.server.ts
import "server-only";
import { cache } from "react";
import { provideFactory, provideValue, Scopes } from "di-craft";
import { createNextDi } from "di-craft/next/server";

export const { getRequestContainer, runWithRequestContainer } = createNextDi({
  cache,
  providers: [
    provideFactory(USERS_SERVICE, {
      scope: Scopes.Scoped,
      deps: { requestId: REQUEST_ID },
      useFactory: ({ requestId }) => new UsersService(requestId),
    }),
  ],
  requestProviders: () => [
    provideValue(REQUEST_ID, crypto.randomUUID()),
  ],
});
```

`getRequestContainer()` returns the same child container within one App Router
RSC render, and a different child container for another render.

## Request Boundaries

`getRequestContainer()` is backed by React's `cache` function. This is the right
primitive for React Server Components because it memoizes work for the lifetime
of one server render pass and is cleared for another render.

That scope is limited to the RSC render tree. Code outside that tree, such as
Server Actions, Route Handlers, middleware, and plain server code, does not share
the same `cache()` memoized value that was created during a page render.

Do not expect this to be the same container:

```txt
Page/RSC render container !== Server Action container
Page/RSC render container !== Route Handler container
```

Use the primitives by boundary:

| Boundary                         | Use                                                              |
| -------------------------------- | ---------------------------------------------------------------- |
| Server Components / nested RSC   | `getRequestContainer()`                                          |
| Route Handlers / Server Actions  | `runWithRequestContainer()`                                      |
| Node middleware-like code        | `di-craft/node` or app-level `AsyncLocalStorage` integration     |

`AsyncLocalStorage` is a complement, not a replacement, for `cache()`. It is the
Node request-scoped primitive to reach for when code outside the RSC render tree
must share one request context. Use `di-craft/node` for explicit Node async
scopes. `di-craft/next` does not use it internally because the adapter keeps RSC
render scope explicit.

React does not expose a general "RSC render finished" hook. Do not put
request-owned resources that require deterministic cleanup in an RSC
`getRequestContainer()` and expect them to be disposed after render. For
transactions, tenant-owned connections, temporary files, audit buffers, and
similar resources, use an explicit lifecycle boundary with `runWithRequestContainer`
or the Node adapter.

## Server Components

Resolve dependencies at the composition edge of a Server Component:

```tsx
import { getRequestContainer } from "./di.server";

export default async function Page() {
  const usersService = getRequestContainer().get(USERS_SERVICE);
  const users = await usersService.list();

  return <UsersView users={users} />;
}
```

Do not pass the container into domain classes or Client Components. Resolve at
the edge, then pass plain values down.

For nested Server Components, repeated calls to `getRequestContainer()` should
resolve through the same request container during the current render. See the
typed example:
[nested-server-components.ts](../examples/typed-docs/next/nested-server-components.ts).

## Route Handlers and Server Actions

Next.js does not expose a general "RSC render is finished" hook. For places
where you own the lifecycle, use `runWithRequestContainer`. It creates a fresh
request container and disposes it in a `finally` block.

Unlike `getRequestContainer()`, this helper does not rely on React request
memoization. It also does not bind the container to async context, so nested
code should either receive the container explicitly or use `di-craft/node`.

```ts
import { runWithRequestContainer } from "./di.server";

export async function GET() {
  return runWithRequestContainer({
    run: async (container) => {
      const users = await container.get(USERS_SERVICE).list();

      return Response.json(users);
    },
  });
}
```

The same helper fits Server Actions, tests, jobs, and custom server entrypoints.

## Node Runtime ALS-First Entry Points

For Node runtime Next.js entrypoints where deep async code should call
`getRequestContainer()` without threading a container argument through every
function, use the Node adapter.

First create an app-local composition module. `createNodeDi()` comes from
`di-craft/node`; the returned helpers are configured with your app providers
and are exported from your own file:

```ts
// app/di.node.ts or lib/di.node.ts
import "server-only";
import { createNodeDi } from "di-craft/node";

export const { getRequestContainer, runWithRequestContainer } = createNodeDi({
  providers,
});
```

Then import those configured helpers from the app-local module and wrap each
entrypoint once:

```ts
import { provideValue } from "di-craft";
import { getRequestContainer, runWithRequestContainer } from "@/lib/di.node";

export async function POST(request: Request) {
  const tenantId = request.headers.get("x-tenant-id") ?? "public";

  return runWithRequestContainer({
    providers: [provideValue(TENANT_ID, tenantId)],
    run: async () => {
      const posts = getRequestContainer().get(POSTS_SERVICE);
      const created = await posts.create();

      return Response.json({ created });
    },
  });
}
```

The same shape works for Server Actions:

```ts
"use server";

import { revalidateTag } from "next/cache";
import { provideValue } from "di-craft";
import { getRequestContainer, runWithRequestContainer } from "@/lib/di.node";

export async function createPost(input: FormData) {
  const tenantId = String(input.get("tenantId") ?? "public");

  return runWithRequestContainer({
    providers: [provideValue(TENANT_ID, tenantId)],
    run: async () => {
      const posts = getRequestContainer().get(POSTS_SERVICE);
      await posts.create(input);
      revalidateTag(`tenant:${tenantId}:posts`);
    },
  });
}
```

Inside RSC code, keep `React.cache()` as a render-pass dedupe layer on top of an
active async scope:

```ts
import { cache } from "react";
import { getRequestContainer } from "@/lib/di.node";

export const listPosts = cache(async () => {
  return getRequestContainer().get(POSTS_SERVICE).list();
});
```

This composition keeps the responsibilities separate:

```txt
AsyncLocalStorage -> request/tenant context and deterministic disposal
React.cache()     -> dedupe within one RSC render pass
```

Be careful with detached work and post-action hooks. Anything that runs after
`runWithRequestContainer()` has settled must receive plain data or enter a new
async scope before calling `getRequestContainer()`.

For APIs such as `unstable_after`, capture the primitive values the deferred
callback needs before scheduling it, then create a fresh minimal scope inside
the callback:

```ts
"use server";

import { revalidateTag } from "next/cache";
import { provideValue } from "di-craft";
import { getRequestContainer, runWithRequestContainer } from "@/lib/di.node";

export async function publishPost(input: FormData) {
  const tenantId = String(input.get("tenantId") ?? "public");

  return runWithRequestContainer({
    providers: [provideValue(TENANT_ID, tenantId)],
    run: async () => {
      const posts = getRequestContainer().get(POSTS_SERVICE);
      const post = await posts.publish(input);

      const capturedTenantId = tenantId;
      const capturedPostId = post.id;

      unstable_after(async () => {
        await runWithRequestContainer({
          providers: [provideValue(TENANT_ID, capturedTenantId)],
          run: async () => {
            const search = getRequestContainer().get(SEARCH_SERVICE);
            await search.index(capturedPostId);
          },
        });
      });

      revalidateTag(`tenant:${tenantId}:posts`);
    },
  });
}
```

The deferred callback should not rely on the original async scope still being
active. Re-enter a new scope, or hoist the work to a queue/background job that
receives plain values.

Typed examples:

- [route-handler.ts](../examples/typed-docs/next/route-handler.ts)
- [server-action.ts](../examples/typed-docs/next/server-action.ts)
- [next-runtime-als.ts](../examples/typed-docs/node/next-runtime-als.ts)

## State Hydration

The adapter does not hydrate a DI container into the browser.

Use this model instead:

```txt
server state -> serializable snapshot -> client state
```

Stateful entities can implement `Hydratable<TSnapshot>`:

```ts
import type { Hydratable } from "di-craft/next/server";

type UserSnapshot = {
  readonly users: readonly string[];
};

class UserState implements Hydratable<UserSnapshot> {
  private users: readonly string[] = [];

  dehydrate(): UserSnapshot {
    return { users: this.users };
  }

  hydrate(snapshot: UserSnapshot): void {
    this.users = snapshot.users;
  }
}
```

Read snapshots on the server:

```ts
import { dehydrate, type HydrationSchema } from "di-craft/next/server";

const hydration = {
  user: USER_STATE,
} satisfies HydrationSchema;

const snapshot = dehydrate({
  container: getRequestContainer(),
  schema: hydration,
});
```

Restore snapshots into a separate client-safe container:

```ts
"use client";

import { hydrate } from "di-craft/next/client";

hydrate({
  container: clientContainer,
  schema: hydration,
  snapshot,
});
```

## Streaming Direction

For streamed UI, prefer the primitives Next.js already provides: Suspense,
`loading.js`, and React's `use` model. `di-craft` should create the data or
state snapshot; Next.js should stream the UI boundary.

The adapter intentionally avoids becoming a state manager. Future helpers should
focus on serializable partial snapshots, not on moving the container itself
across the server/client boundary.

## What This Adapter Does Not Do

- It does not add React or Next.js dependencies to the root `di-craft` import.
- It does not create a global container.
- It does not hydrate the server container on the client.
- It does not guess dependencies from TypeScript types.
- It does not replace Next.js data fetching, Suspense, or streaming primitives.

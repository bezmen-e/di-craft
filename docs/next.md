# Next.js App Router Adapter

The Next.js adapter connects `di-craft` to the App Router and React Server
Components lifecycle without making React or Next.js part of the core package.

Use it when you want:

- one root container on the server;
- one child container per request/render;
- scoped dependencies that live inside that request container;
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
render, and a different child container for another render.

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
memoization. Use it when the request/action boundary is explicit.

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

Typed examples:

- [route-handler.ts](../examples/typed-docs/next/route-handler.ts)
- [server-action.ts](../examples/typed-docs/next/server-action.ts)

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

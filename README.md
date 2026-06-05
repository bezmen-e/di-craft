# di-craft

A tiny, type-safe dependency injection container for TypeScript.

[![npm version](https://img.shields.io/npm/v/di-craft.svg)](https://www.npmjs.com/package/di-craft)
[![bundle size](https://img.shields.io/bundlephobia/minzip/di-craft.svg)](https://bundlephobia.com/package/di-craft)
[![types](https://img.shields.io/npm/types/di-craft.svg)](https://www.npmjs.com/package/di-craft)
[![license](https://img.shields.io/npm/l/di-craft.svg)](./LICENSE)

```ts
import {
  createContainer,
  createToken,
  provideFactory,
  provideValue,
  type Provider,
} from "di-craft";

const CONFIG = createToken<Config>("config");
const LOGGER = createToken<Logger>("logger");
const USERS = createToken<UserService>("users");

const providers: Provider[] = [
  provideValue(CONFIG, loadConfig()),
  provideFactory(LOGGER, {
    deps: { config: CONFIG },
    useFactory: ({ config }) => new Logger(config.level),
  }),
  provideFactory(USERS, {
    deps: { logger: LOGGER },
    useFactory: ({ logger }) => new UserService(logger),
  }),
];

const container = createContainer(providers);

const users = container.get(USERS); // UserService, fully typed
```

## Contents

- [Philosophy](#philosophy)
- [Features](#features)
- [Install](#install)
- [Core concepts](#core-concepts)
  - [Tokens](#tokens)
  - [Providers](#providers)
  - [Container](#container)
  - [Scopes](#scopes)
  - [Disposal](#disposal)
  - [Child containers](#child-containers)
  - [Cycle detection](#cycle-detection)
- [Example: per-request container](#example-per-request-container)
- [Error handling](#error-handling)
- [API reference](#api-reference)
- [License](#license)

## Philosophy

`di-craft` is a small DI container with no magic.

- No decorators
- No `reflect-metadata`
- No framework dependencies

Just **tokens**, **providers**, a **container**, **scopes**, and **cycle detection**.

## Features

- Zero runtime dependencies
- No decorators
- No `reflect-metadata`
- Framework agnostic
- Type-safe tokens and factories
- Singleton, transient, and scoped lifetimes
- Hierarchical child containers
- Deterministic disposal with `onDispose` hooks
- Circular dependency detection
- Tree-shakable, tiny bundle size
- Ships both ESM and CommonJS builds

## Install

```bash
bun add di-craft
npm install di-craft
pnpm add di-craft
yarn add di-craft
```

Requires Node.js `>= 20`.

## Core concepts

### Tokens

A token is a unique, type-carrying key. Identity is based on an internal `symbol`, **not** on the name — two tokens with the same name are still different.

```ts
const PORT = createToken<number>("port");

PORT.name; // "port" — used only for error messages
```

The type argument flows everywhere: providers must produce a matching value, and `container.get(PORT)` returns `number`.

### Providers

A provider tells the container how to produce the value for a token.

`provideValue` — register an existing value:

```ts
provideValue(PORT, 3000);
```

`provideFactory` — build the value lazily, with optional dependencies and scope:

```ts
provideFactory(HTTP, {
  deps: { config: CONFIG },         // optional, keyed map of tokens
  scope: "singleton",                // optional, defaults to "singleton"
  useFactory: ({ config }) => new HttpClient(config.apiUrl),
});
```

The keys in `deps` become the keys of the object passed to `useFactory`, each resolved to its token's type.

### Container

```ts
const container = createContainer(providers); // providers are optional

container.register(provideValue(PORT, 3000)); // register more at any time
container.has(PORT);                           // true
container.get(PORT);                           // 3000
await container.dispose();                     // release resolved singletons
```

Registering the same token twice throws `DuplicateProviderError`. To replace an
existing provider on purpose (handy for tests, mocks, and environment-specific
overrides), pass `{ allowOverride: true }`:

```ts
container.register(provideValue(API, fakeApi), { allowOverride: true });
```

Overriding a token whose value was already resolved as a singleton drops the
cached instance, so the next `get` rebuilds it from the new provider.

### Scopes

| Scope                  | Behavior                                                         |
| ---------------------- | ---------------------------------------------------------------- |
| `singleton` (default)  | The factory runs once; the same instance is returned every time. |
| `transient`            | The factory runs on every `get`, producing a fresh instance.     |
| `scoped`               | One instance per container. In a child container each child gets its own instance, while the provider can still be declared once on the parent. |

Use the `Scopes` helper for autocompletion, or pass the plain string — both work:

```ts
import { Scopes, provideFactory } from "di-craft";

provideFactory(ID, {
  scope: Scopes.Transient, // or scope: "transient"
  useFactory: () => crypto.randomUUID(),
});

container.get(ID) !== container.get(ID); // true
```

A transient provider that depends on a singleton still reuses the shared singleton instance.

### Disposal

Factory providers can declare an `onDispose` hook to release resources (database
pools, sockets, timers, subscriptions). Calling `container.dispose()` runs the
hooks for every resolved singleton and clears the cache:

```ts
const DB = createToken<Pool>("db");

const container = createContainer([
  provideFactory(DB, {
    useFactory: () => createPool(url),
    onDispose: (pool) => pool.end(), // may be sync or async
  }),
]);

container.get(DB);

await container.dispose(); // awaits async hooks, then clears instances
```

Details:

- Hooks run in reverse creation order (dependents before their dependencies).
- `dispose()` returns a promise and awaits async hooks.
- It is idempotent — calling it again is a no-op.
- Only resolved singletons are disposed; transient and never-resolved instances are not tracked.

### Child containers

`createChildContainer(parent, providers?)` creates a child that inherits
everything from its parent but can add or override providers locally. This is the
typical pattern for per-request isolation on a server: shared services live on
the root, request-specific values live on a short-lived child.

```ts
const root = createContainer([
  provideFactory(LOGGER, { useFactory: () => console }), // singleton, shared
  provideFactory(HANDLER, {
    scope: Scopes.Scoped, // one instance per child
    deps: { request: REQUEST },
    useFactory: ({ request }) => createHandler(request),
  }),
]);

function handle(request: Request) {
  const child = createChildContainer(root, [provideValue(REQUEST, request)]);

  child.get(LOGGER); // same logger as the root and every other child
  child.get(HANDLER); // a fresh handler, unique to this child

  return child.dispose(); // release only this child's instances
}
```

How resolution works across the chain:

- A token is looked up in the child first, then walks up to the parent.
- `singleton` is cached on the container that **owns** the provider, so it is shared by the whole subtree.
- `scoped` is cached on the **requesting** child, so each child gets its own instance — even when the provider is declared once on the parent.
- A `scoped` provider resolves its dependencies from the requesting child, so it can depend on values registered only in that child (like `REQUEST`).
- `dispose()` only releases the container it is called on; it does not cascade to parents or children.

### Cycle detection

If providers form a dependency cycle, resolution throws `CircularDependencyError` with the full path instead of overflowing the stack.

```ts
// A -> B -> A
container.get(A); // throws: Circular dependency detected: A -> B -> A
```

## Example: per-request container

A common server pattern: build one **root** container at startup with the
long-lived singletons (a database pool, clients, config), then fork a
short-lived **child** per request for request-specific state. `scoped` providers
give each request its own instance, and `dispose()` releases them once the
response is sent.

```ts
import Fastify, { type FastifyRequest } from "fastify";
import {
  type Container,
  createContainer,
  createChildContainer,
  createToken,
  provideValue,
  provideFactory,
  Scopes,
} from "di-craft";

// Type-safe `request.container`.
declare module "fastify" {
  interface FastifyRequest {
    container: Container;
  }
}

const DB = createToken<Pool>("db");
const REQUEST = createToken<FastifyRequest>("request");
const REQUEST_ID = createToken<string>("request-id");
const USERS = createToken<UserService>("users");

const app = Fastify({ logger: true });

// Built once, shared by every request.
const root = createContainer([
  provideFactory(DB, {
    useFactory: () => createPool(process.env.DATABASE_URL),
    onDispose: (pool) => pool.end(), // closed only on shutdown
  }),
  provideFactory(REQUEST_ID, {
    scope: Scopes.Scoped, // one id per request
    deps: { request: REQUEST }, // resolves the value registered on the child
    useFactory: ({ request }) => request.id, // Fastify's built-in request id
  }),
  provideFactory(USERS, {
    scope: Scopes.Scoped, // one service per request...
    deps: { db: DB }, // ...but reuses the shared pool
    useFactory: ({ db }) => new UserService(db),
  }),
]);

// A fresh child per request, seeded with the request object.
app.addHook("onRequest", async (request) => {
  request.container = createChildContainer(root, [provideValue(REQUEST, request)]);
});

// Release this request's scoped instances once the response is sent.
app.addHook("onResponse", async (request) => {
  await request.container.dispose();
});

app.get("/users/:id", async (request) => {
  const users = request.container.get(USERS);
  const id = request.container.get(REQUEST_ID); // unique to this request

  return users.findById(request.params.id, { traceId: id });
});

// On shutdown, dispose the root to close the shared pool.
app.addHook("onClose", async () => {
  await root.dispose();
});

await app.listen({ port: 3000 });
```

What each scope buys you here:

- `DB` is a **singleton** — created once on the root and reused by every request, so you don't open a new pool per call.
- `REQUEST_ID` and `USERS` are **scoped** — a new instance per child, so each request gets isolated state even though the providers are declared once on the root.
- `REQUEST` is a per-request **value** registered on the child, and the scoped `REQUEST_ID` resolves it from that same child.
- `request.container.dispose()` releases only that request's scoped instances; the shared pool stays open until `root.dispose()` runs on `onClose`.

## Error handling

All errors extend the shared `DiError` base class, so you can catch any container error with a single check:

```ts
import { DiError, MissingProviderError } from "di-craft";

try {
  container.get(SOME_TOKEN);
} catch (error) {
  if (error instanceof MissingProviderError) {
    // a specific failure
  }

  if (error instanceof DiError) {
    // any di-craft error
  }
}
```

| Error                      | Thrown when                                              |
| -------------------------- | -------------------------------------------------------- |
| `MissingProviderError`     | A token is resolved but no provider is registered.       |
| `DuplicateProviderError`   | A token is registered more than once.                    |
| `CircularDependencyError`  | Providers form a dependency cycle.                       |
| `InvalidDependencyError`   | A declared dependency token is missing/undefined.        |

## API reference

| Export                  | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| `createToken<T>(name)`  | Create a unique, typed token.                              |
| `provideValue(token, value)` | Provider that returns an existing value.              |
| `provideFactory(token, options)` | Provider that builds a value via a factory.       |
| `createContainer(providers?)` | Create a container, optionally seeded with providers. |
| `createChildContainer(parent, providers?)` | Create a child container that inherits from `parent`. |
| `Scopes`                | Object of scope values (`Scopes.Singleton`, `Scopes.Transient`, `Scopes.Scoped`). |

Exported types: `Container`, `Token`, `Provider`, `ValueProvider`, `FactoryProvider`, `Scope`, `DisposeHook`, `RegisterOptions`.

Exported errors: `DiError`, `MissingProviderError`, `DuplicateProviderError`, `CircularDependencyError`, `InvalidDependencyError`.

## License

[MIT](./LICENSE)

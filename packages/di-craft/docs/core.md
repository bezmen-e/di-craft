# Core Concepts

This document explains the framework-agnostic `di-craft` core: tokens,
providers, containers, scopes, disposal, child containers, and the dependency
injection model.

For runnable snippets, see [`examples/typed-docs`](../examples/typed-docs).

## Tokens

A token is a unique, type-carrying key. Identity is based on an internal
`symbol`, not on the name. Two tokens with the same name are still different.

```ts
import { createToken } from "di-craft";

const PORT = createToken<number>("port");

PORT.name; // "port", used only for diagnostics
```

The type argument flows through providers and resolution:

```ts
const port = container.get(PORT); // number
```

## Providers

A provider tells the container how to produce the value for a token.

Use `provideValue` when the value already exists:

```ts
provideValue(PORT, 3000);
```

Use `provideFactory` when the value should be built lazily:

```ts
provideFactory(HTTP, {
  deps: { config: CONFIG },
  scope: "singleton",
  useFactory: ({ config }) => new HttpClient(config.apiUrl),
});
```

The keys in `deps` become the keys of the object passed to `useFactory`, and
each property is inferred from the matching token type.

## Annotation-Based Class Providers

If you write services as classes, `@Injectable` can attach provider metadata to
the class. `provideInjectable` then converts the class into a normal factory
provider.

This is only syntax sugar over the same provider model. It does not use
`reflect-metadata`, parameter decorators, runtime type guessing, or a global
container.

See [Annotation-based providers](./annotations.md) for the full guide.

## Optional Dependencies

Wrap a token with `optional` when a dependency is allowed to be missing.

```ts
provideFactory(USERS, {
  deps: { logger: optional(LOGGER) },
  useFactory: ({ logger }) => new UserService(logger),
});
```

The inferred type becomes `Logger | undefined`, so TypeScript forces the absent
case to be handled. Optional only affects the wrapped token itself: if a provider
is registered, it resolves normally and its own errors still surface.

`optional` can also be used directly with `container.get`:

```ts
const logger = container.get(optional(LOGGER)); // Logger | undefined
```

## Container

A container stores providers and resolves values on demand.

```ts
const container = createContainer(providers);

container.register(provideValue(PORT, 3000));
container.has(PORT); // true
container.get(PORT); // 3000
await container.dispose();
```

Registering the same token twice throws `DuplicateProviderError`. To replace a
provider intentionally, pass `{ allowOverride: true }`.

```ts
container.register(provideValue(API, fakeApi), { allowOverride: true });
```

If an already-created disposable singleton would be dropped by an override,
`InvalidProviderError` is thrown. Dispose the container first so the resource is
released intentionally.

## Scopes

| Scope                 | Behavior                                                   |
| --------------------- | ---------------------------------------------------------- |
| `singleton` (default) | One cached instance in the container that owns the provider |
| `transient`           | A fresh instance on every `get`                             |
| `scoped`              | One cached instance per resolving container                 |

Use `Scopes` for autocompletion, or pass the literal string.

```ts
provideFactory(ID, {
  scope: Scopes.Transient,
  useFactory: () => crypto.randomUUID(),
});
```

A provider may only depend on dependencies that live at least as long as itself.
This prevents a longer-lived instance from capturing a shorter-lived one.

- `transient` may depend on anything.
- `scoped` may depend on `scoped`, `singleton`, or values.
- `singleton` may depend only on `singleton` providers or values.

Violating this rule throws `InvalidProviderError` at resolution time.

## Disposal

Factory providers can declare an `onDispose` hook for cached instances.

```ts
const DB = createToken<Pool>("db");

const container = createContainer([
  provideFactory(DB, {
    useFactory: () => createPool(url),
    onDispose: (pool) => pool.end(),
  }),
]);

container.get(DB);
await container.dispose();
```

Disposal rules:

- Hooks run in reverse creation order.
- Async hooks are awaited.
- `dispose()` is idempotent.
- Only resolved cached instances owned by that container are disposed.
- Transient instances are not tracked.
- `onDispose` on a transient provider throws `InvalidProviderError`.

## Child Containers

Child containers inherit providers from a parent and may add or override local
providers. This is the core pattern for request-scoped data on servers.

```ts
const root = createContainer([
  provideFactory(LOGGER, { useFactory: () => console }),
  provideFactory(HANDLER, {
    scope: Scopes.Scoped,
    deps: { request: REQUEST },
    useFactory: ({ request }) => createHandler(request),
  }),
]);

const child = createChildContainer(root, [provideValue(REQUEST, request)]);
```

Resolution across the chain works like this:

- A token is looked up in the child first, then in its parent chain.
- `singleton` is cached on the container that owns the provider.
- `scoped` is cached on the resolving container.
- A `scoped` provider resolves dependencies from the resolving container.
- `dispose()` releases only the container it is called on.

## Cycle Detection

If providers form a cycle, resolution throws `CircularDependencyError` with the
dependency path.

```ts
// A -> B -> A
container.get(A); // Circular dependency detected: A -> B -> A
```

## Async Dependencies

`di-craft` resolves synchronously by design. There is no `getAsync`.

For async setup, either resolve first and register the ready value:

```ts
const db = await connectDatabase(config);
container.register(provideValue(DB, db));
```

Or register a promise as the value:

```ts
const POOL = createToken<Promise<Pool>>("pool");

container.register(
  provideFactory(POOL, {
    useFactory: () => createPool(),
  }),
);

const pool = await container.get(POOL);
```

If a disposable value is a promise, await it inside `onDispose`.

## DI vs Service Location

Use `container.get()` at composition roots: entrypoints, route handlers,
framework hooks, jobs, tests. Do not pass the container into domain classes.

```ts
provideFactory(USERS, {
  deps: { repo: REPO, logger: LOGGER },
  useFactory: ({ repo, logger }) => new UserService(repo, logger),
});
```

This keeps dependencies explicit and testable. Passing the container into a
class hides dependencies and becomes service location.

## Errors

All runtime errors extend `DiError`.

| Error                     | Thrown when                                      |
| ------------------------- | ------------------------------------------------ |
| `MissingProviderError`    | No provider exists for a resolved token          |
| `DuplicateProviderError`  | The same token is registered twice               |
| `CircularDependencyError` | Providers form a cycle                           |
| `InvalidDependencyError`  | A dependency token is missing or undefined       |
| `InvalidProviderError`    | Provider scope, disposal, or override is invalid |

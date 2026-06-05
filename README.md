# di-craft

A tiny, type-safe dependency injection container for TypeScript.

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
- Type-safe tokens
- Explicit factories
- Singleton and transient scopes
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

```ts
provideFactory(ID, {
  scope: "transient",
  useFactory: () => crypto.randomUUID(),
});

container.get(ID) !== container.get(ID); // true
```

A transient provider that depends on a singleton still reuses the shared singleton instance.

### Cycle detection

If providers form a dependency cycle, resolution throws `CircularDependencyError` with the full path instead of overflowing the stack.

```ts
// A -> B -> A
container.get(A); // throws: Circular dependency detected: A -> B -> A
```

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

Exported types: `Container`, `Token`, `Provider`, `ValueProvider`, `FactoryProvider`, `Scope`.

Exported errors: `DiError`, `MissingProviderError`, `DuplicateProviderError`, `CircularDependencyError`, `InvalidDependencyError`.

## License

[MIT](./LICENSE)

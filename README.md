<h1 align="center">di-craft</h1>

<p align="center">
  <img src="./assets/logo.png" alt="di-craft" width="200" />
</p>

<p align="center">
  <b>A tiny, type-safe dependency injection container for TypeScript</b>
  <br />
  <span>Framework-agnostic core with an optional Next.js App Router / RSC adapter</span>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/di-craft">
    <img
      alt="npm version and bundle size"
      src="https://shieldcn.dev/group/npm/di-craft+bundlephobia/minzip/di-craft.svg?variant=secondary"
    />
  </a>
</p>

## Quick Start

Declare typed tokens, describe how each value is built, then resolve at the
composition root.

```ts
import {
  createContainer,
  createToken,
  provideFactory,
  provideValue,
  type Provider,
} from "di-craft";

type Config = {
  readonly logPrefix: string;
};

class Logger {
  private readonly prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  info(message: string): string {
    return `${this.prefix}: ${message}`;
  }
}

class UserService {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  list(): readonly string[] {
    this.logger.info("list users");
    return ["Ada", "Grace"];
  }
}

const CONFIG = createToken<Config>("CONFIG");
const LOGGER = createToken<Logger>("LOGGER");
const USERS = createToken<UserService>("USERS");

const providers: readonly Provider[] = [
  provideValue(CONFIG, { logPrefix: "users" }),
  provideFactory(LOGGER, {
    deps: { config: CONFIG },
    useFactory: ({ config }) => new Logger(config.logPrefix),
  }),
  provideFactory(USERS, {
    deps: { logger: LOGGER },
    useFactory: ({ logger }) => new UserService(logger),
  }),
];

const container = createContainer(providers);
const users = container.get(USERS); // UserService
```

## Why di-craft

- Zero runtime dependencies
- Type-safe tokens and factories
- Optional `@Injectable` annotation for class providers
- Optional Next.js App Router / React Server Components adapter
- Optional dependencies via `optional()`
- Singleton, transient, and scoped lifetimes
- Hierarchical child containers for request-like lifecycles
- Deterministic disposal with `onDispose` hooks
- Circular dependency detection
- Tree-shakable, ESM-only, ships with TypeScript declarations

## Install

```bash
bun add di-craft
npm install di-craft
pnpm add di-craft
yarn add di-craft
```

Requires Node.js `>= 20`. This package is ESM-only.

## Core API

```ts
import {
  Scopes,
  createChildContainer,
  createContainer,
  createToken,
  optional,
  provideFactory,
  provideValue,
} from "di-craft";
```

Core concepts are documented in [docs/core.md](./docs/core.md).

Typed examples are available in [examples/typed-docs](./examples/typed-docs):

- [basic container](./examples/typed-docs/core/basic.ts)
- [scopes and child containers](./examples/typed-docs/core/scopes.ts)
- [annotation-based providers](./examples/typed-docs/annotations/injectable.ts)
- [Next.js request scope](./examples/typed-docs/next/request-scope.ts)
- [Next.js state hydration](./examples/typed-docs/next/hydration.ts)

## Annotation-Based Providers

`@Injectable` lets class-based services describe their token, constructor
dependencies, scope, and disposal hook next to the class.

```ts
import {
  Injectable,
  Scopes,
  createContainer,
  createToken,
  provideInjectable,
  provideValue,
} from "di-craft";

const LOGGER = createToken<Logger>("LOGGER");
const USERS = createToken<UserService>("USERS");

@Injectable({
  token: USERS,
  deps: [LOGGER],
  scope: Scopes.Scoped,
})
class UserService {
  private readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }
}

const container = createContainer([
  provideValue(LOGGER, new Logger()),
  provideInjectable(UserService),
]);
```

Annotations are only syntax sugar over normal providers. There is no
`reflect-metadata`, parameter decorators, runtime type guessing, or global
container.

## Next.js App Router

The Next adapter lives behind subpath exports, so React and Next.js are not part
of the core import.

```ts
// app/di.server.ts
import "server-only";
import { cache } from "react";
import { provideValue } from "di-craft";
import { createNextDi } from "di-craft/next/server";

export const { getRequestContainer, runWithRequestContainer } = createNextDi({
  cache,
  providers,
  requestProviders: () => [
    provideValue(REQUEST_ID, crypto.randomUUID()),
  ],
});
```

Resolve dependencies in Server Components at the composition edge:

```ts
import { getRequestContainer } from "./di.server";

export default async function Page() {
  const users = getRequestContainer().get(USERS_SERVICE);

  return <UsersView users={await users.list()} />;
}
```

For Route Handlers, Server Actions, tests, or jobs where you own the lifecycle,
use `runWithRequestContainer`. It creates a fresh child container and disposes it
in a `finally` block.

```ts
export async function GET() {
  return runWithRequestContainer({
    run: async (container) => {
      const users = await container.get(USERS_SERVICE).list();

      return Response.json(users);
    },
  });
}
```

State hydration is explicit:

```txt
server DI container -> serializable snapshot -> client state
```

The DI container itself is never hydrated.

Runtime subpaths:

| Export                 | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `di-craft/next/server` | `createNextDi`, `dehydrate`, server-side adapter types |
| `di-craft/next/client` | `hydrate`, client-boundary hydration types             |

## API Reference

| Export                                     | Description                                                         |
| ------------------------------------------ | ------------------------------------------------------------------- |
| `createToken<T>(name)`                     | Create a unique, typed token                                        |
| `provideValue(token, value)`               | Register an existing value                                          |
| `provideFactory(token, options)`           | Register a lazy factory with optional dependencies, scope, disposal |
| `@Injectable(options)`                     | Mark a class as a token-backed injectable provider                  |
| `provideInjectable(class)`                 | Create a factory provider from an injectable class                  |
| `optional(token)`                          | Mark a dependency as optional                                       |
| `createContainer(providers?)`              | Create a container                                                  |
| `createChildContainer(parent, providers?)` | Create a child container that inherits from `parent`                |
| `Scopes`                                   | `Singleton`, `Transient`, and `Scoped` scope constants              |

Exported errors: `DiError`, `MissingProviderError`, `DuplicateProviderError`,
`CircularDependencyError`, `InvalidDependencyError`, `InvalidProviderError`.

## License

[MIT](./LICENSE)

# Annotation-Based Providers

`di-craft` can describe class providers with a small annotation API:

```ts
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
```

This is optional syntax sugar over the same provider model used by
`provideFactory`. It does not create a global container, does not inspect
TypeScript types at runtime, and does not use `reflect-metadata`.

Use annotations when you want class services to keep their provider metadata
close to the class. Use `provideFactory` when you prefer all wiring to live in a
composition file.

## Basic Usage

```ts
import {
  Injectable,
  Scopes,
  createContainer,
  createToken,
  provideInjectable,
  provideValue,
} from "di-craft";

class Logger {
  info(message: string): string {
    return message;
  }
}

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

  list(): readonly string[] {
    this.logger.info("list users");
    return ["Ada", "Grace"];
  }
}

const container = createContainer([
  provideValue(LOGGER, new Logger()),
  provideInjectable(UserService),
]);

const users = container.get(USERS); // UserService
```

`provideInjectable(UserService)` returns a normal factory provider. After that,
resolution, scopes, optional dependencies, child containers, overrides, disposal
hooks, and cycle detection behave exactly like regular providers.

## Constructor Dependencies

Dependencies are explicit and ordered by constructor parameter position:

```ts
@Injectable({
  token: USERS,
  deps: [LOGGER, CONFIG],
})
class UserService {
  constructor(logger: Logger, config: Config) {}
}
```

The dependency tuple is type-checked against the constructor parameters. If a
token value type does not match the matching constructor parameter, TypeScript
will report it.

Optional dependencies work the same way as in factory providers:

```ts
@Injectable({
  token: USERS,
  deps: [LOGGER, optional(CONFIG)],
})
class UserService {
  constructor(logger: Logger, config: Config | undefined) {}
}
```

The optional constructor parameter must accept `undefined`.

## Scopes and Disposal

`scope` and `onDispose` are passed through to the generated factory provider:

```ts
@Injectable({
  token: CONNECTION,
  scope: Scopes.Singleton,
  onDispose: (connection) => connection.close(),
})
class Connection {
  close(): void {}
}
```

`onDispose` is supported for cached instances: singleton and scoped providers.
It is not supported for transient providers, because transient instances are not
tracked by the container.

## What It Does Not Do

Annotations in `di-craft` intentionally stay small:

- no `reflect-metadata`;
- no `emitDecoratorMetadata`;
- no parameter decorators;
- no runtime type guessing;
- no auto-registration;
- no global container;
- no classpath scanning.

This means dependency tokens stay explicit:

```ts
@Injectable({
  token: USERS,
  deps: [LOGGER],
})
class UserService {
  constructor(logger: Logger) {}
}
```

The class constructor type is not used as the dependency token. If a dependency
is needed, pass its token in `deps`.

## TypeScript Configuration

`@Injectable` is typed as a standard class decorator. Modern TypeScript supports
this decorator form without `emitDecoratorMetadata`.

`emitDecoratorMetadata` is not required and should stay disabled unless another
library in your app needs it. `di-craft` does not read emitted design types.

## Provider Mapping

An injectable class provider becomes a regular factory provider:

```ts
@Injectable({
  token: USERS,
  deps: [LOGGER],
  scope: Scopes.Scoped,
})
class UserService {
  constructor(logger: Logger) {}
}

provideInjectable(UserService);
```

The generated provider uses the same token, scope, disposal hook, and dependency
tokens. Constructor dependencies are positional, so `deps: [LOGGER]` means
"resolve `LOGGER` and pass it as the first constructor argument".

## When to Use It

Use annotations when:

- services are naturally class-based;
- you want provider metadata next to the class;
- constructor dependencies are simple and stable;
- the syntax makes your composition root easier to scan.

Prefer `provideFactory` when:

- construction has branching logic;
- dependencies should be named rather than positional;
- the class should not import DI tokens;
- the provider belongs to an environment-specific composition file.

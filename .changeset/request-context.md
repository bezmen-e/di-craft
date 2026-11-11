---

## "di-craft": patch

`runWithRequestContainer()` and `createRequestContainer()` in the Node and Next adapters accept an optional request `context` that is forwarded to `requestProviders`, so each kind of request can register a different provider set.

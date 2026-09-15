<h1 align="center">di-craft</h1>

<p align="center">Type-safe dependency injection for TypeScript, with zero runtime magic.</p>

```sh
npm install di-craft
```

```ts
import { createContainer, createToken, provideValue } from "di-craft";

const PORT = createToken<number>("PORT");
const container = createContainer([provideValue(PORT, 3000)]);

container.get(PORT); // number
```

Read the [documentation](https://di-craft.pages.dev) or browse the
[generated API reference](https://di-craft.pages.dev/api/di-craft/readme).

[MIT](./LICENSE)

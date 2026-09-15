# di-craft comparative benchmarks

This workspace compares `di-craft` with six TypeScript dependency-injection
subjects:

- InversifyJS
- Awilix in PROXY and CLASSIC modes
- TSyringe
- TypeDI
- Typed Inject

The methodology and runner structure are adapted from the MIT-licensed
[InferDI benchmark suite](https://github.com/inferdi/inferdi/tree/main/benchmarks).
The implementation uses Bun for tests, orchestration, and every isolated subject
process.

## Run locally

From the repository root:

```bash
bun run benchmarks:precondition
bun run benchmarks:quick
```

Quick mode builds the production package, validates every adapter, runs one
short round, and writes `results/quick-<timestamp>.json`. Quick results are for
local iteration and must not be used for public claims.

Run a publishable balanced block with:

```bash
bun run benchmarks:public
```

The public pipeline uses the frozen root lockfile, the production ESM package,
14 balanced rounds, and one fresh Bun process per subject. It records runtime,
hardware, dependency, Git, and dispersion metadata with the raw timings.

Render a result without changing files:

```bash
bun run benchmarks:report -- results/public-<timestamp>.json
```

After reviewing a public result, update this README and the generated
documentation data together:

```bash
bun run benchmarks:report -- results/public-<timestamp>.json --write
```

Lower values are better. Ratios describe DI operations in these synthetic
scenarios, not whole-application speedups.

<!-- benchmark-report:start -->
## Generated benchmark results

No public benchmark has been published yet.
<!-- benchmark-report:end -->

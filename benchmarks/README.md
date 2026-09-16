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
process. Like the InferDI reference, this directory is intentionally separate
from the root workspace and owns its comparison dependencies in
`benchmarks/bun.lock`.

## Run locally

From the repository root:

```bash
bun run benchmarks:install
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

The public pipeline uses the frozen benchmark lockfile, the production ESM
package, 14 balanced rounds, and one fresh Bun process per subject. It records
runtime, hardware, dependency, Git, and dispersion metadata with the raw timings.

Render a result without changing files:

```bash
bun run benchmarks:report -- results/public-<timestamp>.json
```

After reviewing a public result, update the internal report in this README:

```bash
bun run benchmarks:report -- results/public-<timestamp>.json --write
```

Lower values are better. Ratios describe DI operations in these synthetic
scenarios, not whole-application speedups.

<!-- benchmark-report:start -->
## Generated benchmark results

Production artifact result from `results/public-2026-09-16T07-57-58-707Z.json`.

Commit: `6e7d706760fbe6682529e2dee54f58ccbdc356f8`\
Environment: Bun 1.4.2, darwin 25.4.0, arm64, Apple M5 Pro\
Rounds: 14; central value: median; dispersion: MAD. Lower is better.

### Hot singleton resolve

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 5.333 | 0.001 | 1.00× | 1 |
| InversifyJS | 10.104 | 0.209 | 1.89× | 4 |
| Awilix PROXY | 9.479 | 0.188 | 1.78× | 2 |
| Awilix CLASSIC | 9.604 | 0.271 | 1.80× | 3 |
| TSyringe | 21.230 | 4.229 | 3.98× | 6 |
| TypeDI | 16.521 | 0.375 | 3.10× | 5 |
| Typed Inject | 24.042 | 0.000 | 4.51× | 7 |

### Transient resolve

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 39.166 | 0.498 | 1.23× | 3 |
| InversifyJS | 31.748 | 0.416 | 1.00× | 1 |
| Awilix PROXY | 37.166 | 0.418 | 1.17× | 2 |
| Awilix CLASSIC | 45.666 | 0.834 | 1.44× | 4 |
| TSyringe | 91.002 | 5.584 | 2.87× | 6 |
| TypeDI | 144.58 | 3.084 | 4.55× | 7 |
| Typed Inject | 54.000 | 0.836 | 1.70× | 5 |

### Deep graph (10 levels)

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 268.65 | 5.108 | 1.88× | 3 |
| InversifyJS | 142.71 | 3.750 | 1.00× | 1 |
| Awilix PROXY | 205.00 | 2.910 | 1.44× | 2 |
| Awilix CLASSIC | 578.54 | 9.580 | 4.05× | 6 |
| TSyringe | 488.96 | 7.710 | 3.43× | 5 |
| TypeDI | 1195.8 | 14.692 | 8.38× | 7 |
| Typed Inject | 304.38 | 3.957 | 2.13× | 4 |

### Wide graph (4 dependencies)

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 64.834 | 0.750 | 1.16× | 3 |
| InversifyJS | 55.666 | 0.916 | 1.00× | 1 |
| Awilix PROXY | 70.252 | 0.586 | 1.26× | 4 |
| Awilix CLASSIC | 96.750 | 1.584 | 1.74× | 5 |
| TSyringe | 122.08 | 6.166 | 2.19× | 6 |
| TypeDI | 214.33 | 4.916 | 3.85× | 7 |
| Typed Inject | 63.418 | 1.082 | 1.14× | 2 |

### Wide graph (10 dependencies)

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 152.92 | 1.250 | 1.43× | 4 |
| InversifyJS | 126.04 | 1.880 | 1.18× | 2 |
| Awilix PROXY | 152.70 | 2.080 | 1.43× | 3 |
| Awilix CLASSIC | 184.37 | 1.460 | 1.73× | 5 |
| TSyringe | 241.04 | 5.415 | 2.26× | 6 |
| TypeDI | 529.79 | 11.665 | 4.96× | 7 |
| Typed Inject | 106.87 | 0.830 | 1.00× | 1 |

### Registration

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 381.25 | 6.250 | 1.00× | 1 |
| InversifyJS | 7665.6 | 221.85 | 20.11× | 4 |
| Awilix PROXY | 13986.5 | 342.77 | 36.69× | 5 |
| Awilix CLASSIC | 18304.2 | 383.32 | 48.01× | 6 |
| TSyringe | 518.70 | 18.750 | 1.36× | 3 |
| TypeDI | N/A | N/A | N/A | N/A |
| Typed Inject | 452.10 | 10.450 | 1.19× | 2 |

### First resolve

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 216.87 | 5.415 | 1.00× | 1 |
| InversifyJS | 1694.1 | 191.77 | 7.81× | 7 |
| Awilix PROXY | 691.87 | 186.56 | 3.19× | 4 |
| Awilix CLASSIC | 1236.4 | 215.21 | 5.70× | 6 |
| TSyringe | 309.79 | 6.455 | 1.43× | 3 |
| TypeDI | 1170.6 | 23.545 | 5.40× | 5 |
| Typed Inject | 229.37 | 4.580 | 1.06× | 2 |

### Scope creation

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 26.670 | 1.250 | 1.00× | 1 |
| InversifyJS | 814.48 | 42.810 | 30.54× | 7 |
| Awilix PROXY | 118.54 | 8.335 | 4.44× | 3 |
| Awilix CLASSIC | 122.50 | 10.830 | 4.59× | 4 |
| TSyringe | 192.29 | 11.460 | 7.21× | 6 |
| TypeDI | 173.97 | 3.545 | 6.52× | 5 |
| Typed Inject | 31.665 | 0.825 | 1.19× | 2 |

### First scoped resolve

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 63.125 | 1.040 | 1.13× | 2 |
| InversifyJS | 538.54 | 23.335 | 9.68× | 7 |
| Awilix PROXY | 55.625 | 2.080 | 1.00× | 1 |
| Awilix CLASSIC | 95.830 | 2.290 | 1.72× | 4 |
| TSyringe | 123.33 | 2.915 | 2.22× | 5 |
| TypeDI | 150.21 | 4.165 | 2.70× | 6 |
| Typed Inject | 68.545 | 1.665 | 1.23× | 3 |

### Warm scoped resolve

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 9.125 | 0.105 | 5.34× | 2 |
| InversifyJS | 10.958 | 0.542 | 6.42× | 3 |
| Awilix PROXY | 12.875 | 0.271 | 7.54× | 4 |
| Awilix CLASSIC | 13.709 | 0.251 | 8.03× | 5 |
| TSyringe | 14.792 | 0.105 | 8.66× | 6 |
| TypeDI | 41.500 | 0.667 | 24.30× | 7 |
| Typed Inject | 1.708 | 0.000 | 1.00× | 1 |

### Async teardown

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 90.210 | 2.080 | 1.00× | 1 |
| InversifyJS | N/A | N/A | N/A | N/A |
| Awilix PROXY | 146.88 | 3.125 | 1.63× | 3 |
| Awilix CLASSIC | 145.62 | 3.535 | 1.61× | 2 |
| TSyringe | 223.74 | 4.585 | 2.48× | 5 |
| TypeDI | N/A | N/A | N/A | N/A |
| Typed Inject | 217.50 | 4.165 | 2.41× | 4 |

## Combined benchmark results

### Median ns/op

Median in ns/op.

| Scenario | di-craft | InversifyJS | Awilix PROXY | Awilix CLASSIC | TSyringe | TypeDI | Typed Inject |
|---|---:|---:|---:|---:|---:|---:|---:|
| Hot singleton resolve | 5.333 | 10.104 | 9.479 | 9.604 | 21.230 | 16.521 | 24.042 |
| Transient resolve | 39.166 | 31.748 | 37.166 | 45.666 | 91.002 | 144.58 | 54.000 |
| Deep graph (10 levels) | 268.65 | 142.71 | 205.00 | 578.54 | 488.96 | 1195.8 | 304.38 |
| Wide graph (4 dependencies) | 64.834 | 55.666 | 70.252 | 96.750 | 122.08 | 214.33 | 63.418 |
| Wide graph (10 dependencies) | 152.92 | 126.04 | 152.70 | 184.37 | 241.04 | 529.79 | 106.87 |
| Registration | 381.25 | 7665.6 | 13986.5 | 18304.2 | 518.70 | N/A | 452.10 |
| First resolve | 216.87 | 1694.1 | 691.87 | 1236.4 | 309.79 | 1170.6 | 229.37 |
| Scope creation | 26.670 | 814.48 | 118.54 | 122.50 | 192.29 | 173.97 | 31.665 |
| First scoped resolve | 63.125 | 538.54 | 55.625 | 95.830 | 123.33 | 150.21 | 68.545 |
| Warm scoped resolve | 9.125 | 10.958 | 12.875 | 13.709 | 14.792 | 41.500 | 1.708 |
| Async teardown | 90.210 | N/A | 146.88 | 145.62 | 223.74 | N/A | 217.50 |

### Relative to fastest

Relative to the fastest subject in each scenario.

| Scenario | di-craft | InversifyJS | Awilix PROXY | Awilix CLASSIC | TSyringe | TypeDI | Typed Inject |
|---|---:|---:|---:|---:|---:|---:|---:|
| Hot singleton resolve | 1.00× | 1.89× | 1.78× | 1.80× | 3.98× | 3.10× | 4.51× |
| Transient resolve | 1.23× | 1.00× | 1.17× | 1.44× | 2.87× | 4.55× | 1.70× |
| Deep graph (10 levels) | 1.88× | 1.00× | 1.44× | 4.05× | 3.43× | 8.38× | 2.13× |
| Wide graph (4 dependencies) | 1.16× | 1.00× | 1.26× | 1.74× | 2.19× | 3.85× | 1.14× |
| Wide graph (10 dependencies) | 1.43× | 1.18× | 1.43× | 1.73× | 2.26× | 4.96× | 1.00× |
| Registration | 1.00× | 20.11× | 36.69× | 48.01× | 1.36× | N/A | 1.19× |
| First resolve | 1.00× | 7.81× | 3.19× | 5.70× | 1.43× | 5.40× | 1.06× |
| Scope creation | 1.00× | 30.54× | 4.44× | 4.59× | 7.21× | 6.52× | 1.19× |
| First scoped resolve | 1.13× | 9.68× | 1.00× | 1.72× | 2.22× | 2.70× | 1.23× |
| Warm scoped resolve | 5.34× | 6.42× | 7.54× | 8.03× | 8.66× | 24.30× | 1.00× |
| Async teardown | 1.00× | N/A | 1.63× | 1.61× | 2.48× | N/A | 2.41× |

### Median ± MAD with relative

Median ± MAD in ns/op; the value in parentheses is relative to the fastest subject.

| Scenario | di-craft | InversifyJS | Awilix PROXY | Awilix CLASSIC | TSyringe | TypeDI | Typed Inject |
|---|---:|---:|---:|---:|---:|---:|---:|
| Hot singleton resolve | 5.333 ± 0.001 (1.00×) | 10.104 ± 0.209 (1.89×) | 9.479 ± 0.188 (1.78×) | 9.604 ± 0.271 (1.80×) | 21.230 ± 4.229 (3.98×) | 16.521 ± 0.375 (3.10×) | 24.042 ± 0.000 (4.51×) |
| Transient resolve | 39.166 ± 0.498 (1.23×) | 31.748 ± 0.416 (1.00×) | 37.166 ± 0.418 (1.17×) | 45.666 ± 0.834 (1.44×) | 91.002 ± 5.584 (2.87×) | 144.58 ± 3.084 (4.55×) | 54.000 ± 0.836 (1.70×) |
| Deep graph (10 levels) | 268.65 ± 5.108 (1.88×) | 142.71 ± 3.750 (1.00×) | 205.00 ± 2.910 (1.44×) | 578.54 ± 9.580 (4.05×) | 488.96 ± 7.710 (3.43×) | 1195.8 ± 14.692 (8.38×) | 304.38 ± 3.957 (2.13×) |
| Wide graph (4 dependencies) | 64.834 ± 0.750 (1.16×) | 55.666 ± 0.916 (1.00×) | 70.252 ± 0.586 (1.26×) | 96.750 ± 1.584 (1.74×) | 122.08 ± 6.166 (2.19×) | 214.33 ± 4.916 (3.85×) | 63.418 ± 1.082 (1.14×) |
| Wide graph (10 dependencies) | 152.92 ± 1.250 (1.43×) | 126.04 ± 1.880 (1.18×) | 152.70 ± 2.080 (1.43×) | 184.37 ± 1.460 (1.73×) | 241.04 ± 5.415 (2.26×) | 529.79 ± 11.665 (4.96×) | 106.87 ± 0.830 (1.00×) |
| Registration | 381.25 ± 6.250 (1.00×) | 7665.6 ± 221.85 (20.11×) | 13986.5 ± 342.77 (36.69×) | 18304.2 ± 383.32 (48.01×) | 518.70 ± 18.750 (1.36×) | N/A | 452.10 ± 10.450 (1.19×) |
| First resolve | 216.87 ± 5.415 (1.00×) | 1694.1 ± 191.77 (7.81×) | 691.87 ± 186.56 (3.19×) | 1236.4 ± 215.21 (5.70×) | 309.79 ± 6.455 (1.43×) | 1170.6 ± 23.545 (5.40×) | 229.37 ± 4.580 (1.06×) |
| Scope creation | 26.670 ± 1.250 (1.00×) | 814.48 ± 42.810 (30.54×) | 118.54 ± 8.335 (4.44×) | 122.50 ± 10.830 (4.59×) | 192.29 ± 11.460 (7.21×) | 173.97 ± 3.545 (6.52×) | 31.665 ± 0.825 (1.19×) |
| First scoped resolve | 63.125 ± 1.040 (1.13×) | 538.54 ± 23.335 (9.68×) | 55.625 ± 2.080 (1.00×) | 95.830 ± 2.290 (1.72×) | 123.33 ± 2.915 (2.22×) | 150.21 ± 4.165 (2.70×) | 68.545 ± 1.665 (1.23×) |
| Warm scoped resolve | 9.125 ± 0.105 (5.34×) | 10.958 ± 0.542 (6.42×) | 12.875 ± 0.271 (7.54×) | 13.709 ± 0.251 (8.03×) | 14.792 ± 0.105 (8.66×) | 41.500 ± 0.667 (24.30×) | 1.708 ± 0.000 (1.00×) |
| Async teardown | 90.210 ± 2.080 (1.00×) | N/A | 146.88 ± 3.125 (1.63×) | 145.62 ± 3.535 (1.61×) | 223.74 ± 4.585 (2.48×) | N/A | 217.50 ± 4.165 (2.41×) |
<!-- benchmark-report:end -->

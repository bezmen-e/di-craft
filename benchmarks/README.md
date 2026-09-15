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

Production artifact result from `results/public-2026-09-15T20-17-34-154Z.json`.

Commit: `b0e9685185d15c5a4390b3cb315148d438cbac3d`\
Environment: Bun 1.4.2, darwin 25.4.0, arm64, Apple M5 Pro\
Rounds: 14; central value: median; dispersion: MAD. Lower is better.

### Hot singleton resolve

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 5.208 | 0.042 | 1.00× | 1 |
| InversifyJS | 9.667 | 0.209 | 1.86× | 4 |
| Awilix PROXY | 9.125 | 0.104 | 1.75× | 2 |
| Awilix CLASSIC | 9.167 | 0.229 | 1.76× | 3 |
| TSyringe | 24.146 | 0.625 | 4.64× | 7 |
| TypeDI | 16.083 | 0.312 | 3.09× | 5 |
| Typed Inject | 24.042 | 0.000 | 4.62× | 6 |

### Transient resolve

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 47.002 | 0.584 | 1.55× | 4 |
| InversifyJS | 30.334 | 0.500 | 1.00× | 1 |
| Awilix PROXY | 35.584 | 0.500 | 1.17× | 2 |
| Awilix CLASSIC | 44.248 | 0.420 | 1.46× | 3 |
| TSyringe | 90.416 | 4.248 | 2.98× | 6 |
| TypeDI | 142.42 | 1.334 | 4.69× | 7 |
| Typed Inject | 53.084 | 0.834 | 1.75× | 5 |

### Deep graph (10 levels)

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 332.61 | 3.955 | 2.46× | 4 |
| InversifyJS | 135.00 | 2.500 | 1.00× | 1 |
| Awilix PROXY | 198.12 | 2.080 | 1.47× | 2 |
| Awilix CLASSIC | 550.00 | 7.300 | 4.07× | 6 |
| TSyringe | 460.83 | 11.250 | 3.41× | 5 |
| TypeDI | 1171.6 | 21.250 | 8.68× | 7 |
| Typed Inject | 292.08 | 5.625 | 2.16× | 3 |

### Wide graph (4 dependencies)

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 72.250 | 1.084 | 1.34× | 4 |
| InversifyJS | 54.084 | 1.502 | 1.00× | 1 |
| Awilix PROXY | 67.750 | 1.082 | 1.25× | 3 |
| Awilix CLASSIC | 94.000 | 0.836 | 1.74× | 5 |
| TSyringe | 118.33 | 5.291 | 2.19× | 6 |
| TypeDI | 208.25 | 3.164 | 3.85× | 7 |
| Typed Inject | 61.834 | 0.666 | 1.14× | 2 |

### Wide graph (10 dependencies)

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 161.46 | 2.910 | 1.56× | 4 |
| InversifyJS | 122.92 | 3.125 | 1.19× | 2 |
| Awilix PROXY | 147.50 | 2.085 | 1.43× | 3 |
| Awilix CLASSIC | 179.79 | 3.955 | 1.74× | 5 |
| TSyringe | 232.29 | 8.335 | 2.25× | 6 |
| TypeDI | 516.25 | 12.290 | 5.00× | 7 |
| Typed Inject | 103.33 | 1.245 | 1.00× | 1 |

### Registration

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 1070.9 | 10.400 | 2.39× | 3 |
| InversifyJS | 7493.8 | 85.400 | 16.73× | 4 |
| Awilix PROXY | 13245.9 | 72.875 | 29.57× | 5 |
| Awilix CLASSIC | 17739.6 | 143.75 | 39.61× | 6 |
| TSyringe | 458.30 | 4.150 | 1.02× | 2 |
| TypeDI | N/A | N/A | N/A | N/A |
| Typed Inject | 447.90 | 2.100 | 1.00× | 1 |

### First resolve

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 246.25 | 4.580 | 1.10× | 2 |
| InversifyJS | 1397.3 | 44.790 | 6.26× | 7 |
| Awilix PROXY | 553.54 | 7.085 | 2.48× | 4 |
| Awilix CLASSIC | 1056.3 | 27.705 | 4.73× | 5 |
| TSyringe | 301.98 | 3.018 | 1.35× | 3 |
| TypeDI | 1129.6 | 13.545 | 5.06× | 6 |
| Typed Inject | 223.12 | 1.250 | 1.00× | 1 |

### Scope creation

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 26.045 | 0.420 | 1.00× | 1 |
| InversifyJS | 797.50 | 24.063 | 30.62× | 7 |
| Awilix PROXY | 119.79 | 8.125 | 4.60× | 4 |
| Awilix CLASSIC | 109.79 | 6.870 | 4.22× | 3 |
| TSyringe | 176.67 | 1.870 | 6.78× | 6 |
| TypeDI | 168.13 | 1.455 | 6.46× | 5 |
| Typed Inject | 30.830 | 0.210 | 1.18× | 2 |

### First scoped resolve

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 72.915 | 0.835 | 1.35× | 3 |
| InversifyJS | 539.17 | 11.045 | 9.95× | 7 |
| Awilix PROXY | 54.165 | 1.147 | 1.00× | 1 |
| Awilix CLASSIC | 93.335 | 1.040 | 1.72× | 4 |
| TSyringe | 121.25 | 1.460 | 2.24× | 5 |
| TypeDI | 145.00 | 1.880 | 2.68× | 6 |
| Typed Inject | 66.040 | 0.835 | 1.22× | 2 |

### Warm scoped resolve

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 8.791 | 0.208 | 5.27× | 2 |
| InversifyJS | 11.355 | 0.125 | 6.81× | 3 |
| Awilix PROXY | 12.313 | 0.209 | 7.39× | 4 |
| Awilix CLASSIC | 13.103 | 0.271 | 7.86× | 5 |
| TSyringe | 14.584 | 0.396 | 8.75× | 6 |
| TypeDI | 39.937 | 0.521 | 23.96× | 7 |
| Typed Inject | 1.667 | 0.000 | 1.00× | 1 |

### Async teardown

| Subject | Median ns/op | MAD ns/op | Relative | Rank |
|---|---:|---:|---:|---:|
| di-craft | 87.500 | 0.420 | 1.00× | 1 |
| InversifyJS | N/A | N/A | N/A | N/A |
| Awilix PROXY | 137.70 | 1.875 | 1.57× | 2 |
| Awilix CLASSIC | 140.41 | 2.495 | 1.60× | 3 |
| TSyringe | 220.83 | 3.535 | 2.52× | 5 |
| TypeDI | N/A | N/A | N/A | N/A |
| Typed Inject | 213.33 | 3.125 | 2.44× | 4 |

## Combined benchmark results

### Median ns/op

Median in ns/op.

| Scenario | di-craft | InversifyJS | Awilix PROXY | Awilix CLASSIC | TSyringe | TypeDI | Typed Inject |
|---|---:|---:|---:|---:|---:|---:|---:|
| Hot singleton resolve | 5.208 | 9.667 | 9.125 | 9.167 | 24.146 | 16.083 | 24.042 |
| Transient resolve | 47.002 | 30.334 | 35.584 | 44.248 | 90.416 | 142.42 | 53.084 |
| Deep graph (10 levels) | 332.61 | 135.00 | 198.12 | 550.00 | 460.83 | 1171.6 | 292.08 |
| Wide graph (4 dependencies) | 72.250 | 54.084 | 67.750 | 94.000 | 118.33 | 208.25 | 61.834 |
| Wide graph (10 dependencies) | 161.46 | 122.92 | 147.50 | 179.79 | 232.29 | 516.25 | 103.33 |
| Registration | 1070.9 | 7493.8 | 13245.9 | 17739.6 | 458.30 | N/A | 447.90 |
| First resolve | 246.25 | 1397.3 | 553.54 | 1056.3 | 301.98 | 1129.6 | 223.12 |
| Scope creation | 26.045 | 797.50 | 119.79 | 109.79 | 176.67 | 168.13 | 30.830 |
| First scoped resolve | 72.915 | 539.17 | 54.165 | 93.335 | 121.25 | 145.00 | 66.040 |
| Warm scoped resolve | 8.791 | 11.355 | 12.313 | 13.103 | 14.584 | 39.937 | 1.667 |
| Async teardown | 87.500 | N/A | 137.70 | 140.41 | 220.83 | N/A | 213.33 |

### Relative to fastest

Relative to the fastest subject in each scenario.

| Scenario | di-craft | InversifyJS | Awilix PROXY | Awilix CLASSIC | TSyringe | TypeDI | Typed Inject |
|---|---:|---:|---:|---:|---:|---:|---:|
| Hot singleton resolve | 1.00× | 1.86× | 1.75× | 1.76× | 4.64× | 3.09× | 4.62× |
| Transient resolve | 1.55× | 1.00× | 1.17× | 1.46× | 2.98× | 4.69× | 1.75× |
| Deep graph (10 levels) | 2.46× | 1.00× | 1.47× | 4.07× | 3.41× | 8.68× | 2.16× |
| Wide graph (4 dependencies) | 1.34× | 1.00× | 1.25× | 1.74× | 2.19× | 3.85× | 1.14× |
| Wide graph (10 dependencies) | 1.56× | 1.19× | 1.43× | 1.74× | 2.25× | 5.00× | 1.00× |
| Registration | 2.39× | 16.73× | 29.57× | 39.61× | 1.02× | N/A | 1.00× |
| First resolve | 1.10× | 6.26× | 2.48× | 4.73× | 1.35× | 5.06× | 1.00× |
| Scope creation | 1.00× | 30.62× | 4.60× | 4.22× | 6.78× | 6.46× | 1.18× |
| First scoped resolve | 1.35× | 9.95× | 1.00× | 1.72× | 2.24× | 2.68× | 1.22× |
| Warm scoped resolve | 5.27× | 6.81× | 7.39× | 7.86× | 8.75× | 23.96× | 1.00× |
| Async teardown | 1.00× | N/A | 1.57× | 1.60× | 2.52× | N/A | 2.44× |

### Median ± MAD with relative

Median ± MAD in ns/op; the value in parentheses is relative to the fastest subject.

| Scenario | di-craft | InversifyJS | Awilix PROXY | Awilix CLASSIC | TSyringe | TypeDI | Typed Inject |
|---|---:|---:|---:|---:|---:|---:|---:|
| Hot singleton resolve | 5.208 ± 0.042 (1.00×) | 9.667 ± 0.209 (1.86×) | 9.125 ± 0.104 (1.75×) | 9.167 ± 0.229 (1.76×) | 24.146 ± 0.625 (4.64×) | 16.083 ± 0.312 (3.09×) | 24.042 ± 0.000 (4.62×) |
| Transient resolve | 47.002 ± 0.584 (1.55×) | 30.334 ± 0.500 (1.00×) | 35.584 ± 0.500 (1.17×) | 44.248 ± 0.420 (1.46×) | 90.416 ± 4.248 (2.98×) | 142.42 ± 1.334 (4.69×) | 53.084 ± 0.834 (1.75×) |
| Deep graph (10 levels) | 332.61 ± 3.955 (2.46×) | 135.00 ± 2.500 (1.00×) | 198.12 ± 2.080 (1.47×) | 550.00 ± 7.300 (4.07×) | 460.83 ± 11.250 (3.41×) | 1171.6 ± 21.250 (8.68×) | 292.08 ± 5.625 (2.16×) |
| Wide graph (4 dependencies) | 72.250 ± 1.084 (1.34×) | 54.084 ± 1.502 (1.00×) | 67.750 ± 1.082 (1.25×) | 94.000 ± 0.836 (1.74×) | 118.33 ± 5.291 (2.19×) | 208.25 ± 3.164 (3.85×) | 61.834 ± 0.666 (1.14×) |
| Wide graph (10 dependencies) | 161.46 ± 2.910 (1.56×) | 122.92 ± 3.125 (1.19×) | 147.50 ± 2.085 (1.43×) | 179.79 ± 3.955 (1.74×) | 232.29 ± 8.335 (2.25×) | 516.25 ± 12.290 (5.00×) | 103.33 ± 1.245 (1.00×) |
| Registration | 1070.9 ± 10.400 (2.39×) | 7493.8 ± 85.400 (16.73×) | 13245.9 ± 72.875 (29.57×) | 17739.6 ± 143.75 (39.61×) | 458.30 ± 4.150 (1.02×) | N/A | 447.90 ± 2.100 (1.00×) |
| First resolve | 246.25 ± 4.580 (1.10×) | 1397.3 ± 44.790 (6.26×) | 553.54 ± 7.085 (2.48×) | 1056.3 ± 27.705 (4.73×) | 301.98 ± 3.018 (1.35×) | 1129.6 ± 13.545 (5.06×) | 223.12 ± 1.250 (1.00×) |
| Scope creation | 26.045 ± 0.420 (1.00×) | 797.50 ± 24.063 (30.62×) | 119.79 ± 8.125 (4.60×) | 109.79 ± 6.870 (4.22×) | 176.67 ± 1.870 (6.78×) | 168.13 ± 1.455 (6.46×) | 30.830 ± 0.210 (1.18×) |
| First scoped resolve | 72.915 ± 0.835 (1.35×) | 539.17 ± 11.045 (9.95×) | 54.165 ± 1.147 (1.00×) | 93.335 ± 1.040 (1.72×) | 121.25 ± 1.460 (2.24×) | 145.00 ± 1.880 (2.68×) | 66.040 ± 0.835 (1.22×) |
| Warm scoped resolve | 8.791 ± 0.208 (5.27×) | 11.355 ± 0.125 (6.81×) | 12.313 ± 0.209 (7.39×) | 13.103 ± 0.271 (7.86×) | 14.584 ± 0.396 (8.75×) | 39.937 ± 0.521 (23.96×) | 1.667 ± 0.000 (1.00×) |
| Async teardown | 87.500 ± 0.420 (1.00×) | N/A | 137.70 ± 1.875 (1.57×) | 140.41 ± 2.495 (1.60×) | 220.83 ± 3.535 (2.52×) | N/A | 213.33 ± 3.125 (2.44×) |
<!-- benchmark-report:end -->

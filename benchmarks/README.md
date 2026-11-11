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

Regenerate the interactive SVG chart on the documentation performance page
(written to `docs/src/assets/performance-chart.svg`):

```bash
bun run benchmarks:chart -- results/public-<timestamp>.json
```

Lower values are better. Ratios describe DI operations in these synthetic
scenarios, not whole-application speedups.

<!-- benchmark-report:start -->
## Generated benchmark results

Production artifact result from `results/public-2026-11-11T14-57-42-521Z.json`.

Commit: `9619dccbbfcabd9e4d54108062827851de8c2037` (dirty workspace)\
Environment: Bun 1.4.2, darwin 25.4.0, arm64, Apple M5 Pro\
Rounds: 14; central value: median; dispersion: MAD. Lower is better.

### Hot singleton resolve

| Subject        | Median ns/op | MAD ns/op | Relative | Rank |
| -------------- | -----------: | --------: | -------: | ---: |
| di-craft       |        5.458 |     0.124 |    1.00× |    1 |
| InversifyJS    |       10.042 |     0.083 |    1.84× |    4 |
| Awilix PROXY   |        9.708 |     0.083 |    1.78× |    3 |
| Awilix CLASSIC |        9.604 |     0.124 |    1.76× |    2 |
| TSyringe       |       24.375 |     0.646 |    4.47× |    7 |
| TypeDI         |       17.125 |     0.084 |    3.14× |    5 |
| Typed Inject   |       24.042 |     0.000 |    4.40× |    6 |

### Transient resolve

| Subject        | Median ns/op | MAD ns/op | Relative | Rank |
| -------------- | -----------: | --------: | -------: | ---: |
| di-craft       |       32.582 |     0.248 |    1.03× |    2 |
| InversifyJS    |       31.668 |     0.332 |    1.00× |    1 |
| Awilix PROXY   |       37.500 |     0.248 |    1.18× |    3 |
| Awilix CLASSIC |       45.918 |     0.418 |    1.45× |    4 |
| TSyringe       |       95.000 |     3.332 |    3.00× |    6 |
| TypeDI         |       147.58 |     3.336 |    4.66× |    7 |
| Typed Inject   |       54.416 |     0.916 |    1.72× |    5 |

### Deep graph (10 levels)

| Subject        | Median ns/op | MAD ns/op | Relative | Rank |
| -------------- | -----------: | --------: | -------: | ---: |
| di-craft       |       181.67 |     0.835 |    1.28× |    2 |
| InversifyJS    |       141.87 |     0.835 |    1.00× |    1 |
| Awilix PROXY   |       207.71 |     1.875 |    1.46× |    3 |
| Awilix CLASSIC |       577.92 |     3.745 |    4.07× |    6 |
| TSyringe       |       487.09 |     8.330 |    3.43× |    5 |
| TypeDI         |       1218.5 |    15.935 |    8.59× |    7 |
| Typed Inject   |       307.30 |     6.875 |    2.17× |    4 |

### Wide graph (4 dependencies)

| Subject        | Median ns/op | MAD ns/op | Relative | Rank |
| -------------- | -----------: | --------: | -------: | ---: |
| di-craft       |       54.084 |     0.252 |    1.00× |    1 |
| InversifyJS    |       55.334 |     0.166 |    1.02× |    2 |
| Awilix PROXY   |       71.664 |     0.502 |    1.33× |    4 |
| Awilix CLASSIC |       99.250 |     1.084 |    1.84× |    5 |
| TSyringe       |       123.50 |     1.082 |    2.28× |    6 |
| TypeDI         |       215.50 |     1.668 |    3.98× |    7 |
| Typed Inject   |       63.666 |     1.165 |    1.18× |    3 |

### Wide graph (10 dependencies)

| Subject        | Median ns/op | MAD ns/op | Relative | Rank |
| -------------- | -----------: | --------: | -------: | ---: |
| di-craft       |       122.50 |     0.625 |    1.13× |    2 |
| InversifyJS    |       125.41 |     0.410 |    1.16× |    3 |
| Awilix PROXY   |       152.29 |     1.250 |    1.41× |    4 |
| Awilix CLASSIC |       187.92 |     2.085 |    1.73× |    5 |
| TSyringe       |       244.58 |     1.255 |    2.26× |    6 |
| TypeDI         |       542.92 |    10.000 |    5.01× |    7 |
| Typed Inject   |       108.34 |     1.040 |    1.00× |    1 |

### Registration

| Subject        | Median ns/op | MAD ns/op | Relative | Rank |
| -------------- | -----------: | --------: | -------: | ---: |
| di-craft       |       760.45 |     6.250 |    1.61× |    3 |
| InversifyJS    |       7517.7 |    47.850 |   15.90× |    4 |
| Awilix PROXY   |      13540.6 |    69.775 |   28.63× |    5 |
| Awilix CLASSIC |      18109.4 |    169.78 |   38.29× |    6 |
| TSyringe       |       508.30 |     8.300 |    1.07× |    2 |
| TypeDI         |          N/A |       N/A |      N/A |  N/A |
| Typed Inject   |       472.95 |     4.150 |    1.00× |    1 |

### First resolve

| Subject        | Median ns/op | MAD ns/op | Relative | Rank |
| -------------- | -----------: | --------: | -------: | ---: |
| di-craft       |       183.33 |     2.080 |    1.00× |    1 |
| InversifyJS    |       1693.4 |    15.727 |    9.24× |    7 |
| Awilix PROXY   |       792.92 |    16.562 |    4.33× |    4 |
| Awilix CLASSIC |       1444.4 |    57.395 |    7.88× |    6 |
| TSyringe       |       312.29 |     3.960 |    1.70× |    3 |
| TypeDI         |       1171.5 |    12.500 |    6.39× |    5 |
| Typed Inject   |       233.96 |     2.080 |    1.28× |    2 |

### Scope creation

| Subject        | Median ns/op | MAD ns/op | Relative | Rank |
| -------------- | -----------: | --------: | -------: | ---: |
| di-craft       |       26.460 |     0.620 |    1.00× |    1 |
| InversifyJS    |       827.71 |    18.543 |   31.28× |    7 |
| Awilix PROXY   |       112.92 |     3.750 |    4.27× |    3 |
| Awilix CLASSIC |       119.79 |    11.040 |    4.53× |    4 |
| TSyringe       |       188.96 |     2.705 |    7.14× |    6 |
| TypeDI         |       176.46 |     1.875 |    6.67× |    5 |
| Typed Inject   |       33.545 |     0.620 |    1.27× |    2 |

### First scoped resolve

| Subject        | Median ns/op | MAD ns/op | Relative | Rank |
| -------------- | -----------: | --------: | -------: | ---: |
| di-craft       |       57.295 |     0.625 |    1.03× |    2 |
| InversifyJS    |       549.59 |    11.142 |    9.84× |    7 |
| Awilix PROXY   |       55.830 |     0.420 |    1.00× |    1 |
| Awilix CLASSIC |       97.500 |     2.085 |    1.75× |    4 |
| TSyringe       |       126.46 |     1.875 |    2.27× |    5 |
| TypeDI         |       151.04 |     2.505 |    2.71× |    6 |
| Typed Inject   |       68.750 |     0.830 |    1.23× |    3 |

### Warm scoped resolve

| Subject        | Median ns/op | MAD ns/op | Relative | Rank |
| -------------- | -----------: | --------: | -------: | ---: |
| di-craft       |        8.521 |     0.146 |    4.99× |    2 |
| InversifyJS    |       11.125 |     0.042 |    6.51× |    3 |
| Awilix PROXY   |       12.916 |     0.063 |    7.56× |    4 |
| Awilix CLASSIC |       13.729 |     0.187 |    8.04× |    5 |
| TSyringe       |       14.958 |     0.105 |    8.76× |    6 |
| TypeDI         |       41.812 |     0.188 |   24.48× |    7 |
| Typed Inject   |        1.708 |     0.000 |    1.00× |    1 |

### Async teardown

| Subject        | Median ns/op | MAD ns/op | Relative | Rank |
| -------------- | -----------: | --------: | -------: | ---: |
| di-craft       |       93.750 |     0.420 |    1.00× |    1 |
| InversifyJS    |          N/A |       N/A |      N/A |  N/A |
| Awilix PROXY   |       145.42 |     0.840 |    1.55× |    2 |
| Awilix CLASSIC |       146.04 |     1.245 |    1.56× |    3 |
| TSyringe       |       230.83 |     3.535 |    2.46× |    5 |
| TypeDI         |          N/A |       N/A |      N/A |  N/A |
| Typed Inject   |       223.12 |     1.670 |    2.38× |    4 |

## Combined benchmark results

### Median ns/op

Median in ns/op.

| Scenario                     | di-craft | InversifyJS | Awilix PROXY | Awilix CLASSIC | TSyringe | TypeDI | Typed Inject |
| ---------------------------- | -------: | ----------: | -----------: | -------------: | -------: | -----: | -----------: |
| Hot singleton resolve        |    5.458 |      10.042 |        9.708 |          9.604 |   24.375 | 17.125 |       24.042 |
| Transient resolve            |   32.582 |      31.668 |       37.500 |         45.918 |   95.000 | 147.58 |       54.416 |
| Deep graph (10 levels)       |   181.67 |      141.87 |       207.71 |         577.92 |   487.09 | 1218.5 |       307.30 |
| Wide graph (4 dependencies)  |   54.084 |      55.334 |       71.664 |         99.250 |   123.50 | 215.50 |       63.666 |
| Wide graph (10 dependencies) |   122.50 |      125.41 |       152.29 |         187.92 |   244.58 | 542.92 |       108.34 |
| Registration                 |   760.45 |      7517.7 |      13540.6 |        18109.4 |   508.30 |    N/A |       472.95 |
| First resolve                |   183.33 |      1693.4 |       792.92 |         1444.4 |   312.29 | 1171.5 |       233.96 |
| Scope creation               |   26.460 |      827.71 |       112.92 |         119.79 |   188.96 | 176.46 |       33.545 |
| First scoped resolve         |   57.295 |      549.59 |       55.830 |         97.500 |   126.46 | 151.04 |       68.750 |
| Warm scoped resolve          |    8.521 |      11.125 |       12.916 |         13.729 |   14.958 | 41.812 |        1.708 |
| Async teardown               |   93.750 |         N/A |       145.42 |         146.04 |   230.83 |    N/A |       223.12 |

### Relative to fastest

Relative to the fastest subject in each scenario.

| Scenario                     | di-craft | InversifyJS | Awilix PROXY | Awilix CLASSIC | TSyringe | TypeDI | Typed Inject |
| ---------------------------- | -------: | ----------: | -----------: | -------------: | -------: | -----: | -----------: |
| Hot singleton resolve        |    1.00× |       1.84× |        1.78× |          1.76× |    4.47× |  3.14× |        4.40× |
| Transient resolve            |    1.03× |       1.00× |        1.18× |          1.45× |    3.00× |  4.66× |        1.72× |
| Deep graph (10 levels)       |    1.28× |       1.00× |        1.46× |          4.07× |    3.43× |  8.59× |        2.17× |
| Wide graph (4 dependencies)  |    1.00× |       1.02× |        1.33× |          1.84× |    2.28× |  3.98× |        1.18× |
| Wide graph (10 dependencies) |    1.13× |       1.16× |        1.41× |          1.73× |    2.26× |  5.01× |        1.00× |
| Registration                 |    1.61× |      15.90× |       28.63× |         38.29× |    1.07× |    N/A |        1.00× |
| First resolve                |    1.00× |       9.24× |        4.33× |          7.88× |    1.70× |  6.39× |        1.28× |
| Scope creation               |    1.00× |      31.28× |        4.27× |          4.53× |    7.14× |  6.67× |        1.27× |
| First scoped resolve         |    1.03× |       9.84× |        1.00× |          1.75× |    2.27× |  2.71× |        1.23× |
| Warm scoped resolve          |    4.99× |       6.51× |        7.56× |          8.04× |    8.76× | 24.48× |        1.00× |
| Async teardown               |    1.00× |         N/A |        1.55× |          1.56× |    2.46× |    N/A |        2.38× |

### Median ± MAD with relative

Median ± MAD in ns/op; the value in parentheses is relative to the fastest subject.

| Scenario                     |               di-craft |              InversifyJS |              Awilix PROXY |            Awilix CLASSIC |               TSyringe |                  TypeDI |           Typed Inject |
| ---------------------------- | ---------------------: | -----------------------: | ------------------------: | ------------------------: | ---------------------: | ----------------------: | ---------------------: |
| Hot singleton resolve        |  5.458 ± 0.124 (1.00×) |   10.042 ± 0.083 (1.84×) |     9.708 ± 0.083 (1.78×) |     9.604 ± 0.124 (1.76×) | 24.375 ± 0.646 (4.47×) |  17.125 ± 0.084 (3.14×) | 24.042 ± 0.000 (4.40×) |
| Transient resolve            | 32.582 ± 0.248 (1.03×) |   31.668 ± 0.332 (1.00×) |    37.500 ± 0.248 (1.18×) |    45.918 ± 0.418 (1.45×) | 95.000 ± 3.332 (3.00×) |  147.58 ± 3.336 (4.66×) | 54.416 ± 0.916 (1.72×) |
| Deep graph (10 levels)       | 181.67 ± 0.835 (1.28×) |   141.87 ± 0.835 (1.00×) |    207.71 ± 1.875 (1.46×) |    577.92 ± 3.745 (4.07×) | 487.09 ± 8.330 (3.43×) | 1218.5 ± 15.935 (8.59×) | 307.30 ± 6.875 (2.17×) |
| Wide graph (4 dependencies)  | 54.084 ± 0.252 (1.00×) |   55.334 ± 0.166 (1.02×) |    71.664 ± 0.502 (1.33×) |    99.250 ± 1.084 (1.84×) | 123.50 ± 1.082 (2.28×) |  215.50 ± 1.668 (3.98×) | 63.666 ± 1.165 (1.18×) |
| Wide graph (10 dependencies) | 122.50 ± 0.625 (1.13×) |   125.41 ± 0.410 (1.16×) |    152.29 ± 1.250 (1.41×) |    187.92 ± 2.085 (1.73×) | 244.58 ± 1.255 (2.26×) | 542.92 ± 10.000 (5.01×) | 108.34 ± 1.040 (1.00×) |
| Registration                 | 760.45 ± 6.250 (1.61×) | 7517.7 ± 47.850 (15.90×) | 13540.6 ± 69.775 (28.63×) | 18109.4 ± 169.78 (38.29×) | 508.30 ± 8.300 (1.07×) |                     N/A | 472.95 ± 4.150 (1.00×) |
| First resolve                | 183.33 ± 2.080 (1.00×) |  1693.4 ± 15.727 (9.24×) |   792.92 ± 16.562 (4.33×) |   1444.4 ± 57.395 (7.88×) | 312.29 ± 3.960 (1.70×) | 1171.5 ± 12.500 (6.39×) | 233.96 ± 2.080 (1.28×) |
| Scope creation               | 26.460 ± 0.620 (1.00×) | 827.71 ± 18.543 (31.28×) |    112.92 ± 3.750 (4.27×) |   119.79 ± 11.040 (4.53×) | 188.96 ± 2.705 (7.14×) |  176.46 ± 1.875 (6.67×) | 33.545 ± 0.620 (1.27×) |
| First scoped resolve         | 57.295 ± 0.625 (1.03×) |  549.59 ± 11.142 (9.84×) |    55.830 ± 0.420 (1.00×) |    97.500 ± 2.085 (1.75×) | 126.46 ± 1.875 (2.27×) |  151.04 ± 2.505 (2.71×) | 68.750 ± 0.830 (1.23×) |
| Warm scoped resolve          |  8.521 ± 0.146 (4.99×) |   11.125 ± 0.042 (6.51×) |    12.916 ± 0.063 (7.56×) |    13.729 ± 0.187 (8.04×) | 14.958 ± 0.105 (8.76×) | 41.812 ± 0.188 (24.48×) |  1.708 ± 0.000 (1.00×) |
| Async teardown               | 93.750 ± 0.420 (1.00×) |                      N/A |    145.42 ± 0.840 (1.55×) |    146.04 ± 1.245 (1.56×) | 230.83 ± 3.535 (2.46×) |                     N/A | 223.12 ± 1.670 (2.38×) |
<!-- benchmark-report:end -->

# Comparative Benchmark Suite Design

Date: 2026-09-15

Status: approved in chat

## Context

The current performance tooling lives in `packages/di-craft/bench`. It consists
of one Mitata microbenchmark and one Bun CPU-profiling workload. It measures
`di-craft` in isolation, does not validate equivalent behavior against other DI
containers, and does not produce reproducible public reports.

The replacement will adopt the methodology of the InferDI comparative benchmark
workspace while adapting the scenario set, package management, and task wiring
to this Bun and mise monorepo.

Reference: <https://github.com/inferdi/inferdi/tree/main/benchmarks>

## Goals

- Compare `di-craft` with established TypeScript DI containers using equivalent
  object graphs and lifetimes.
- Detect invalid or unfair adapters before collecting timings.
- Provide a fast local feedback loop and a stricter public-result pipeline.
- Isolate every benchmark subject in a fresh process and balance launch-order
  effects across public rounds.
- Store machine-readable raw results and generate deterministic Markdown tables.
- Keep benchmark-only dependencies and their lockfile isolated from the library
  and documentation workspaces.

## Non-goals

- Preserve the existing Mitata benchmark or CPU profiler.
- Benchmark features that `di-craft` does not expose, such as a dedicated lazy
  injection API or synchronous container disposal.
- Run comparative benchmarks in normal CI. Performance runs are intentionally
  initiated by a maintainer on a controlled machine.
- Treat DI microbenchmark ratios as whole-application performance claims.

## Repository layout and Bun isolation

The suite will be a top-level `benchmarks/` package:

```text
benchmarks/
  package.json
  bun.lock
  bunfig.toml
  tsconfig.json
  README.md
  scripts/
  src/
    containers/
    fixtures/
    precondition/
    runner/
  results/
```

Bun supports arbitrary workspace paths, including a root-level `benchmarks`
entry. This package will deliberately **not** be added to the root `workspaces`
array, however. A Bun workspace member shares the monorepo lockfile and install,
whereas benchmark reproducibility benefits from an independent dependency graph.
This matches the InferDI reference: its root workspace includes only
`packages/*` and `apps/*`, while `benchmarks/` has its own lockfile and a local
workspace definition with no members.

Commands will use `bun --cwd benchmarks ...` or `bun install --cwd benchmarks`.
Because the root workspace patterns remain `packages/*` and `docs`, Bun treats
`benchmarks/` as its own package root and writes `benchmarks/bun.lock`. A small
artifact loader will dynamically import either `packages/di-craft/src/index.ts`
or the production `packages/di-craft/dist/index.mjs`; no workspace dependency or
test-runner alias is required.

The benchmark package will be private and use exact dependency versions plus a
frozen lockfile for public runs. Benchmark dependencies will use an isolated
`benchmarks/node_modules`, not the root install.

All orchestration, tests, TypeScript execution, and benchmark child processes
will run on Bun. The suite will not depend on Vitest, Vite, SWC, or a decorator
transform. Adapters for decorator-oriented containers will use their explicit
token and factory registration APIs, so fixture classes remain plain TypeScript.
`reflect-metadata` will be loaded only where a compared package requires its
runtime shim.

## Subjects

The initial subject set will match InferDI's comparison set, replacing InferDI
with `di-craft`:

1. di-craft
2. InversifyJS
3. Awilix PROXY
4. Awilix CLASSIC
5. TSyringe
6. TypeDI
7. Typed Inject

Every subject implements a shared adapter contract. The contract exposes only
the operations needed by scenarios and declares optional capabilities such as
registration and asynchronous teardown. Unsupported operations are recorded as
unsupported instead of being approximated with a semantically different API.

Substantial code adapted from InferDI's MIT-licensed suite will retain an
attribution note in `benchmarks/README.md`.

## Common object graph

Fixtures will be ordinary classes whose constructors make identity assertions
possible. Every adapter will build the same graph:

- singleton logger and config values;
- singleton repository depending on logger and config;
- singleton service depending on repository and logger;
- transient service depending on repository and logger;
- a transient chain ten levels deep;
- transient nodes with four and ten dependencies;
- a scoped service shared within one child scope but isolated between scopes;
- a disposable scoped service for asynchronous teardown measurements.

Precondition tests will prove singleton and transient identity, graph shape,
scope isolation, disposal behavior, and independence of cold containers before
any timed command is allowed to run.

## Scenarios

The first version will contain these comparable scenarios:

1. Hot singleton resolve
2. Transient resolve
3. Deep graph, ten levels
4. Wide graph, four dependencies
5. Wide graph, ten dependencies
6. Registration
7. First resolve from a cold container
8. Scope creation
9. First scoped resolve
10. Warm scoped resolve
11. Async teardown

Operations will be batched inside each Tinybench task so timer overhead does not
dominate short resolutions. The reported value is the median batch duration
normalized to nanoseconds per DI operation. Setup and cleanup belong in
Tinybench hooks and are excluded from the timed operation unless the scenario
explicitly measures them.

The suite will omit InferDI's lazy-resolve and synchronous-teardown scenarios.
`di-craft` has lazy factory construction but no equivalent lazy dependency
handle, and its public disposal contract is asynchronous. Re-labeling unrelated
operations would make the comparison misleading.

## Execution modes

### Quick

Quick mode is for adapter and scenario development:

- source artifact selected through the dynamic artifact loader;
- typecheck and all preconditions run first;
- one short benchmark round;
- one fresh Bun process per subject;
- raw output stored as `results/quick-<timestamp>.json`;
- output explicitly marked unsuitable for public claims.

### Public

Public mode is the only source of publishable results:

1. Install benchmark dependencies with `bun install --frozen-lockfile`.
2. Typecheck the benchmark package.
3. Build the production `di-craft` ESM artifact.
4. Run adapter preconditions against that production artifact.
5. Run one complete balanced subject-order block.
6. Save environment, dependency, Git, configuration, and timing data as JSON.

There are seven subjects. A balanced Latin square with an odd number of subjects
requires `2N` rows to balance process positions and ordered predecessor effects,
so one public block contains 14 rounds. The runner will derive the block size
from the subject count instead of hard-coding InferDI's eight-round block.

Each round launches every subject in its own fresh Bun process. Subjects never
share module caches, global DI state, garbage-collector history, or JIT history
within a process.

## Raw results and reports

Raw JSON will use an explicit schema version and contain:

- generation time and execution mode;
- source or production artifact selection;
- Git commit and dirty-worktree flag;
- Bun, operating system, architecture, CPU, and available power-mode data;
- exact versions of every compared library and benchmark dependency;
- warmup duration, measurement duration, round count, process-isolation level,
  and subject-order strategy;
- per-round order and per-scenario raw Tinybench statistics;
- normalized nanoseconds per operation or an unsupported marker.

The reporter will validate the schema and scenario consistency, aggregate each
subject with median and median absolute deviation, and produce:

- one table per scenario;
- a combined median table;
- a combined relative-to-fastest table;
- a combined median, MAD, and relative table.

Report generation must be deterministic. A `--write` option may replace the
generated section of `benchmarks/README.md` only when the input is a production,
frozen-lockfile, subject-isolated result containing complete 14-round balanced
blocks with at least the default public warmup and measurement durations.

Quick JSON files will be ignored. Selected public JSON files may be committed
alongside the generated report so claims retain their raw evidence.

## Commands and mise integration

The repository root will expose commands equivalent to:

- `benchmarks:install`
- `benchmarks:typecheck`
- `benchmarks:precondition`
- `benchmarks:bench`
- `benchmarks:quick`
- `benchmarks:source`
- `benchmarks:public`
- `benchmarks:report`

A new `benchmarks/mise.toml` will own the implementation commands, and the root
mise monorepo will include `benchmarks` as a config root. Mise configuration is
independent of Bun workspace membership, so this does not merge dependency
graphs. Root `package.json` scripts will remain thin delegates to mise.

The benchmark package scripts will use Bun directly: `bun test` for adapter,
merge, ordering, and report tests; `bun run` for TypeScript orchestration and
subject runners; and Bun process/file APIs where they simplify isolation and
result handling. Tinybench remains the measurement engine, executed inside the
Bun runtime.

The existing package-local `bench` and `profile` scripts, benchmark tasks,
`mitata` dependency, `packages/di-craft/bench/` directory, and associated README
references will be removed.

## Failure behavior

- Type errors, failed adapter contracts, invalid CLI arguments, incomplete
  rounds, or failed child processes stop the pipeline with a non-zero exit code.
- A failed run does not write a completed aggregate result.
- Temporary per-subject results are written under an OS temporary directory and
  removed in a `finally` block.
- The report command rejects inconsistent subjects, scenarios, support status,
  result schemas, or incomplete balanced blocks.
- Unsupported adapter capabilities remain explicit `N/A` values and do not
  silently execute a different operation.

## Verification

Implementation is complete when:

- benchmark typechecking passes;
- every adapter passes the common precondition suite;
- tests prove the odd-subject balanced order covers every subject position and
  balances every ordered adjacent pair across a 14-round block;
- merge and report tests cover incomplete, malformed, unsupported, and valid
  results;
- quick mode completes all supported scenarios and writes valid raw JSON;
- report generation is byte-for-byte deterministic;
- the normal library and documentation quality pipelines still pass after the
  old benchmark dependencies and tasks are removed.

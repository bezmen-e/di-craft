# Performance

This folder contains local performance probes for the public core API.

Run microbenchmarks:

```bash
bun run bench
```

Generate a CPU profile for the hot resolution workload:

```bash
bun run profile
```

Profiles are written to `.tmp/profiles/` in Chrome DevTools and markdown
formats. Use `DI_CRAFT_PROFILE_ITERATIONS` to make the profiling workload longer
or shorter:

```bash
DI_CRAFT_PROFILE_ITERATIONS=1000000 bun run profile
```

Treat benchmark numbers as local comparison data. For meaningful before/after
checks, run on the same machine, close noisy background work, and compare several
runs rather than a single result.

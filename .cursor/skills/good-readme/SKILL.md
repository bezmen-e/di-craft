---
name: good-readme
description: >-
  Write or improve README.md for di-craft. Use when creating, rewriting,
  reviewing, or polishing the README. Fetch and follow the latest Evil
  Martians good-readme skill, then apply the di-craft constraints below.
  Do NOT use for CHANGELOG or CONTRIBUTING.
---

Fetch and follow:

https://raw.githubusercontent.com/evilmartians/agent-skills/main/skills/good-readme/SKILL.md

Then apply these di-craft constraints (they win on conflict):

- Keep the logo. Still drop badges.
- Locked claims: explicit typed tokens and `deps` maps; `get()` in composition
  roots; no `reflect-metadata`; no runtime type guessing; no global container;
  zero runtime dependencies; `@Injectable` is optional sugar.
- Next.js RSC = `di-craft/next/server`. Node ALS = `di-craft/node`. Do not mix
  those scopes. Tests: child containers / overrides, not module mocks.
- Comparisons only with checkable facts. No invented benchmarks.
- README must keep **When di-craft is a good fit**, **When you probably don't
  need di-craft**, and **AI coding agents**.
- Keep the typed example links under `examples/typed-docs/` as a readable list,
  not one packed sentence.
- Until `skills/di-craft` ships in the npm package, the agents section says it
  is coming and points at README + `docs/`. After it ships, document
  skills-npm discovery. No `postinstall` that writes into `.cursor` / `.claude`
  / `.codex`.

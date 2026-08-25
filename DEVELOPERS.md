# Developer Guide

The everyday workflow of this repository. Run `npm run docmap` for the design documentation.

## Stack and layout

A single TypeScript package (ESM only), published as `knex-libsql-client`: a Knex dialect for `@libsql/client`. Source in `src/`, tests in `test/` (Vitest), lint and format with Biome, compiled output in `dist/`.

## Workspaces

A workspace is a git worktree plus its setup: `.plans` and `.local` symlinked to the main worktree, then `npm install` and `npm run build`. This repository has no dev server, so the tooling runs portless: nothing to start, no `dev` script.

Run `npm run workspace -- --guide` to learn the full procedures.

## Conventions

- _Ticket ID_: numeric.
- _Branch naming_: `<type>/<ticket-id>` (e.g. `feat/1`).
- _Commit messages_: conventional commits; when a ticket applies, prefix its ID with `#` (e.g. `fix: [#123] handle empty blobs`).
- _Default branch_: `main`.

## Everyday commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript |
| `npm test` | Run the test suite |
| `npm run lint` / `npm run lint:fix` | Check / fix with Biome |
| `npm run check` | Lint + build + test — run before any push |
| `npm run docmap` | Browse the project documentation |
| `npm run workspace -- <command>` | Manage worktree workspaces (`--guide` for the procedures) |
| `npm run plans:sync` | Publish and retrieve the task plans (`.plans`) |

# Development instructions

Always ignore the `.local`, `.local-wt` and `.plans` directories when searching the codebase.

## Docmap - Seek Documentation

*Before* any investigation or code exploration, run `npm run docmap`, then read the relevant documentation. Mandatory for every task.

### Essential Documentation

Always read before any investigation or work:

- `docs/architecture.md` — how the dialect extends Knex's SQLite3 client
- `docs/code-style.md` — the conventions every change must follow

## Local environment commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Auto-fix code style |
| `npm run check` | Lint + build + test |

## Workspaces

A **workspace** is a git worktree (with its branch) plus its own dev setup: symlinked shared directories and seeded config files. Workspaces are isolated, so you can work on several branches in parallel. This repository has no dev server, so the system runs portless: nothing to start, no `dev` script.

Run `npm run workspace -- --guide` for the full procedures.

## AlignFirst - Ticket ID, Commit Message, Default Branch

_Ticket ID:_ Format is numeric. Use the ticket ID if explicitly provided. Otherwise, deduce it from the current branch name (no confirmation needed). If the branch name is unavailable, get it via `git branch --show-current`. Only ask the user as a last resort.

_Commit message convention:_ conventional commits, e.g. `feat: add transaction support`. When a ticket applies, prefix its ID with a `#` sign, e.g. `fix: [#123] handle empty blobs`.

_Branch naming convention:_ `<type>/<ticket-id>` (e.g. `feat/1`).

_Default branch:_ `main`

### Team Plans Repository

In the main worktree, `.plans` is a symlink into a clone of the team plans repository (folder `knex-libsql-client/`). Plans are shared with the team through that repository and are never committed in this one.

After every change in `.plans/`, synchronize the plans: `npm run plans:sync`.

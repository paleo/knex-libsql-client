# Development instructions

## Seek project conventions and documentation

Run `npx -y alignfirst context` once from the repository root, _before_ any investigation or code exploration. It prints the project conventions, the documentation map, and the AlignFirst protocols.

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

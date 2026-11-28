# Development instructions

## Start every session with the project context

Run `npx -y alignfirst context` from the repository root as your first command, whatever the task. It prints the project conventions (ticket IDs, branch names, commits), the documentation map, and the AlignFirst protocols.

### Essential Documentation

Always read before any investigation or work:

- `docs/architecture.md` — how the dialect extends Knex's SQLite3 client
- `docs/code-style.md` — the conventions every change must follow

## Local environment commands

| Command            | Purpose              |
| ------------------ | -------------------- |
| `npm install`      | Install dependencies |
| `npm run build`    | Compile TypeScript   |
| `npm test`         | Run tests            |
| `npm run lint`     | Check code style     |
| `npm run lint:fix` | Auto-fix code style  |
| `npm run check`    | Lint + build + test  |

## Workspaces

A workspace is a Git worktree with shared `.plans` and `.local`, installed dependencies, and a compiled package. Setup validates the existing plans and runtime exclusions, then runs `npm install` and `npm run build`. This repository has no dev server or ports.

Run `npx -y alignfirst workspace --guide` for the full procedures. Exclude `.plans`, `.local`, and `.local-wt` from broad codebase searches.

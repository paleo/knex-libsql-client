# Development instructions

Always ignore the `_plans` directory when searching the codebase.

## Local environment commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run build` | Compile TypeScript |
| `npm test` | Run tests |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Auto-fix code style |

## Ticket ID

_Ticket ID_: Format is numeric. Use the ticket ID if explicitly provided. Otherwise, deduce it from the current branch name (no confirmation needed). If the branch name is unavailable, get it via `git branch --show-current`. Only ask the user as a last resort.

In commit messages, always prefix the ticket ID with a `#` sign, e.g., `#123`.

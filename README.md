# knex-libsql-client

A [Knex](https://knexjs.org/) dialect for [@libsql/client](https://github.com/tursodatabase/libsql-client-ts).

## Install

```bash
npm install knex @libsql/client knex-libsql-client
```

## Usage

Local database:

```ts
import { createLibsqlKnex } from "knex-libsql-client";

const db = createLibsqlKnex({
  connection: {
    url: "file:./my.db",
    initCommands: ["PRAGMA foreign_keys = ON"],
  },
});

const rows = await db("users").select("*");
```

In-memory database:

```ts
const db = createLibsqlKnex({
  connection: {
    url: ":memory:",
    initCommands: ["PRAGMA foreign_keys = ON"],
  },
});
```

Remote database (Turso / LibSQL server):

```ts
const db = createLibsqlKnex({
  connection: {
    url: "libsql://your-db.turso.io",
    authToken: process.env.TURSO_AUTH_TOKEN,
    initCommands: ["PRAGMA foreign_keys = ON"],
  },
});
```

### Connection options

| Option | Description |
| --- | --- |
| `url` | Database URL. Use `file:./path/to/db.sqlite` for a local file, `:memory:` for in-memory, or an `https://` / `wss://` URL for a remote LibSQL server (e.g. Turso). |
| `filename` | Alternative to `url` for local files — converted to a `file:` URL automatically. |
| `authToken` | Auth token for remote LibSQL connections. |
| `initCommands` | Array of SQL statements to execute on each new connection, in order. Useful for PRAGMAs such as `PRAGMA foreign_keys = ON`. A failure in any command discards the connection. |

## Contribute

After a fresh clone:

```sh
npm install
mkdir .plans   # or `npx alignfirst plans setup <clone-path>` with the team plans repository
npm run workspace -- setup
```

The tooling runs [AlignFirst](https://github.com/paleo/alignfirst) through `npx alignfirst`. Install it globally (`npm install -g alignfirst`) to use the bare `alignfirst` command.

See [DEVELOPERS.md](DEVELOPERS.md) for the development workflow.

## License

MIT

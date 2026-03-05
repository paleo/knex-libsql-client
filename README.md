# knex-libsql-client

A [Knex](https://knexjs.org/) dialect for [@libsql/client](https://github.com/tursodatabase/libsql-client-ts), which is the only maintained async SQLite driver for Node.js.

## Why async SQLite?

The established SQLite drivers for Node.js are either deprecated or synchronous:

- **`sqlite3`** (`node-sqlite3`) — deprecated and no longer maintained
- **`better-sqlite3`** — synchronous
- **Node.js built-in `node:sqlite`** — synchronous

Synchronous access works fine when SQLite is used like a conventional relational database: a single file, text and numeric columns, no blobs, no large amounts of data. But SQLite can be used differently:

- **As a file container** — storing images or binary assets directly in a database can be [faster than the filesystem](https://sqlite.org/fasterthanfs.html). Reading large blobs synchronously blocks the Node.js event loop.
- **Multi-tenant architectures** — one database per customer is a natural fit for SQLite. A synchronous driver serializes all I/O across every concurrent request.

In these scenarios, blocking the event loop is not acceptable. `@libsql/client` is the only maintained driver that keeps all database I/O fully asynchronous.

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

## License

MIT

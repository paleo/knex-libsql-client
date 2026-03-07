---
title: Architecture
summary: How the dialect extends Knex's SQLite3 client and handles transactions.
read_when:
  - understanding how this package works internally
  - modifying or extending the dialect
  - debugging transaction behavior
---

# Architecture

## Extending Knex's SQLite3 Client

`ClientLibSQL` (in `src/client-libsql.ts`) extends Knex's built-in `Client_SQLite3`. This reuses all SQLite-specific compilers (query, schema, table, column, view, DDL) and the query builder. Only the driver/connection layer is overridden:

- **`_driver()`** — returns `createClient` from `@libsql/client`.
- **`acquireRawConnection()`** — calls `createClient({ url, authToken })` and runs any `initCommands`.
- **`destroyRawConnection()`** — calls `connection.close()`.
- **`_query()`** — maps Knex's query object to `@libsql/client`'s `execute()`. Formats bindings (`Date` → `.valueOf()`, `boolean` → `Number()`). Routes queries through the native transaction handle when one is active.
- **`processResponse()`** — inherited from `Client_SQLite3`, no override needed.

The pool defaults to `{ min: 1, max: 1 }` (inherited SQLite3 behavior).

## Transaction Handling

This is the critical piece that differentiates this package from abandoned alternatives. See `src/transaction-libsql.ts`.

### The Problem

`@libsql/client`'s `execute()` on remote backends (HTTP, WebSocket) is stateless — sending `BEGIN` then `INSERT` as separate calls doesn't guarantee they run on the same underlying connection.

### The Solution

`TransactionLibSQL` extends Knex's base `Transaction` and detects the connection protocol:

- **Remote backends** (`protocol !== "file"`): uses `@libsql/client`'s native interactive transaction API. The native transaction handle is stored on `conn.__knexLibsqlTxn` so that `_query()` routes all queries through it.
- **Local file backend** (`protocol === "file"`): falls back to SQL-based `BEGIN`/`COMMIT`/`ROLLBACK` via the base class, since all queries go through the same underlying database.

Nested transactions (savepoints) use the inherited `SAVEPOINT`/`RELEASE` SQL — these work correctly because they execute through the native transaction handle's `execute()`.

## Type Declarations

`src/knex-libsql.d.ts` provides module declarations for Knex internals (`knex/lib/dialects/sqlite3/index.js` and `knex/lib/execution/transaction.js`) that aren't exported in Knex's public type definitions.

## Source Files

| File | Purpose |
| --- | --- |
| `src/index.ts` | Public API: re-exports `ClientLibSQL`, exports `createLibsqlKnex` helper |
| `src/client-libsql.ts` | `ClientLibSQL` class — connection and query layer |
| `src/transaction-libsql.ts` | `TransactionLibSQL` class — transaction lifecycle |
| `src/knex-libsql.d.ts` | Type declarations for Knex internal modules |

declare module "knex/lib/dialects/sqlite3/index.js" {
  import { Knex } from "knex";
  class Client_SQLite3 extends Knex.Client {}
  export = Client_SQLite3;
}

declare module "knex/lib/execution/transaction.js" {
  import type { Knex } from "knex";
  class Transaction {
    constructor(client: Knex.Client, ...args: unknown[]);
    client: Knex.Client;
    trxClient: Knex.Client;
    _completed: boolean;
    _resolver: (value?: unknown) => void;
    _rejecter: (reason?: unknown) => void;
    doNotRejectOnRollback: boolean;
    isCompleted(): boolean;
    begin(conn: unknown): Promise<unknown>;
    savepoint(conn: unknown): Promise<unknown>;
    commit(conn: unknown, value?: unknown): Promise<unknown>;
    rollback(conn: unknown, error?: unknown): Promise<unknown>;
    release(conn: unknown, value?: unknown): Promise<unknown>;
    rollbackTo(conn: unknown, error?: unknown): Promise<unknown>;
    query(conn: unknown, sql: string, status?: number, value?: unknown): Promise<unknown>;
  }
  export = Transaction;
}

import Client_SQLite3 from "knex/lib/dialects/sqlite3/index.js";
import type { Knex } from "knex";
import {
  createClient,
  type Client as LibsqlClient,
  type Transaction as LibsqlTransaction,
} from "@libsql/client";
import TransactionLibSQL from "./transaction-libsql.js";

export interface LibsqlConnection extends LibsqlClient {
  __knexLibsqlTxn?: LibsqlTransaction;
}

export interface LibsqlConnectionConfig {
  url?: string;
  filename?: string;
  authToken?: string;
  initCommands?: string[];
}

export default class ClientLibSQL extends Client_SQLite3 {
  declare connectionSettings: LibsqlConnectionConfig;
  declare destroy: (callback?: (err?: unknown) => void) => Promise<void>;

  constructor(config: Knex.Config) {
    const connection = (config.connection ?? {}) as LibsqlConnectionConfig;

    // SQLite does not support DEFAULT in INSERT; default to NULL substitution.
    if (config.useNullAsDefault === undefined) config.useNullAsDefault = true;

    if (connection.url === undefined) {
      if (connection.filename !== undefined) {
        connection.url =
          connection.filename === ":memory:" ? ":memory:" : `file:${connection.filename}`;
      }
    }

    // Ensure `filename` is set so `Client_SQLite3`'s constructor doesn't warn
    if (connection.filename === undefined && connection.url !== undefined) {
      connection.filename = connection.url;
    }

    // Mutated config is passed to super(); cast required because Knex's
    // StaticConnectionConfig union doesn't include LibsqlConnectionConfig.
    (config as any).connection = connection;
    super(config);
  }

  _driver() {
    return createClient;
  }

  async acquireRawConnection(): Promise<LibsqlConnection> {
    const { url, authToken, initCommands } = this.connectionSettings as LibsqlConnectionConfig;
    if (!url) {
      throw new Error("Connection URL is required");
    }
    const connection = createClient({ url, authToken });
    if (initCommands) {
      for (const sql of initCommands) {
        await connection.execute(sql);
      }
    }
    return connection;
  }

  async destroyRawConnection(connection: LibsqlConnection) {
    connection.close();
  }

  async _query(connection: LibsqlConnection, obj: any) {
    if (!obj.sql) throw new Error("The query is empty");

    const bindings = this._formatBindings(obj.bindings);
    const target = connection.__knexLibsqlTxn ?? connection;
    const result = await target.execute({ sql: obj.sql, args: bindings });

    obj.response = result.rows.map((row: any) => {
      const mapped: Record<string, unknown> = {};
      for (const key of Object.keys(row)) {
        const val = row[key];
        mapped[key] = val instanceof ArrayBuffer ? Buffer.from(val) : val;
      }
      return mapped;
    });
    obj.context = {
      lastID: result.lastInsertRowid !== undefined ? Number(result.lastInsertRowid) : 0,
      changes: result.rowsAffected,
    };

    return obj;
  }

  _formatBindings(bindings: any[]) {
    if (!bindings) return [];
    return bindings.map((binding) => {
      if (binding instanceof Date) return binding.valueOf();
      if (typeof binding === "boolean") return Number(binding);
      return binding;
    });
  }
}

Object.assign(ClientLibSQL.prototype, {
  driverName: "libsql",
  dialect: "libsql",
  transaction(...args: unknown[]) {
    return new TransactionLibSQL(this as any, ...args);
  },
});

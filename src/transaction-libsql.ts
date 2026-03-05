import Transaction from "knex/lib/execution/transaction.js";
import type { Client as LibsqlClient, Transaction as LibsqlTransaction } from "@libsql/client";

interface LibsqlConnection extends LibsqlClient {
  __knexLibsqlTxn?: LibsqlTransaction;
}

// Detects whether the connection uses a remote protocol that requires native
// interactive transactions. The local sqlite3 backend (`protocol === "file"`)
// can use regular SQL-based BEGIN/COMMIT/ROLLBACK because all queries go through
// the same underlying database. Remote backends (http, ws) need native transactions
// because separate `execute()` calls may be routed to different connections.
function needsNativeTransaction(conn: LibsqlConnection): boolean {
  return conn.protocol !== "file";
}

class TransactionLibSQL extends Transaction {
  async begin(conn: LibsqlConnection) {
    if (needsNativeTransaction(conn)) {
      const nativeTxn = await conn.transaction("write");
      conn.__knexLibsqlTxn = nativeTxn;
      return;
    }
    // Local sqlite3: SQL-based transaction via base class query mechanism
    return this.query(conn, "BEGIN;");
  }

  async commit(conn: LibsqlConnection, value: any) {
    const txn = conn.__knexLibsqlTxn;
    if (!txn) {
      // SQL-based path (local sqlite3)
      return this.query(conn, "COMMIT;", 1, value);
    }
    // Native transaction path (remote)
    this._completed = true;
    conn.__knexLibsqlTxn = undefined;
    try {
      await txn.commit();
      txn.close();
      this._resolver(value);
    } catch (err) {
      this._rejecter(err);
    }
  }

  async rollback(conn: LibsqlConnection, error: any) {
    const txn = conn.__knexLibsqlTxn;
    if (!txn) {
      // SQL-based path (local sqlite3)
      return this.query(conn, "ROLLBACK", 2, error);
    }
    // Native transaction path (remote)
    this._completed = true;
    conn.__knexLibsqlTxn = undefined;
    try {
      await txn.rollback();
      txn.close();
      if (error === undefined && this.doNotRejectOnRollback) {
        this._resolver();
      } else {
        this._rejecter(error);
      }
    } catch (err) {
      this._rejecter(err);
    }
  }
}

export default TransactionLibSQL;

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import ClientLibSQL from "../src/client-libsql.js";
import { createLibsqlKnex } from "../src/index.js";

const db = createLibsqlKnex({
  connection: { url: ":memory:" },
});

beforeAll(async () => {
  await db.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("email");
    table.integer("age");
    table.boolean("active");
    table.float("score");
    table.dateTime("created_at");
    table.binary("avatar");
  });
});

afterAll(async () => {
  await db.destroy();
});

describe("schema builder", () => {
  it("creates a table and verifies it exists", async () => {
    const exists = await db.schema.hasTable("users");
    expect(exists).toBe(true);
  });

  it("creates and drops a table", async () => {
    await db.schema.createTable("temp_table", (table) => {
      table.increments("id");
      table.string("value");
    });
    expect(await db.schema.hasTable("temp_table")).toBe(true);

    await db.schema.dropTable("temp_table");
    expect(await db.schema.hasTable("temp_table")).toBe(false);
  });

  it("alters a table (add column)", async () => {
    await db.schema.alterTable("users", (table) => {
      table.string("nickname");
    });
    await db("users").insert({ name: "alter_test", nickname: "nick" });
    const [row] = await db("users").where({ name: "alter_test" }).select("nickname");
    expect(row.nickname).toBe("nick");
    await db("users").where({ name: "alter_test" }).del();
  });
});

describe("basic CRUD", () => {
  it("inserts and selects rows", async () => {
    await db("users").insert({ name: "Alice", email: "alice@test.com" });
    await db("users").insert({ name: "Bob", email: "bob@test.com" });

    const rows = await db("users").select("*").orderBy("name");
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.find((r: any) => r.name === "Alice")).toBeTruthy();
    expect(rows.find((r: any) => r.name === "Bob")).toBeTruthy();
  });

  it("updates rows", async () => {
    await db("users").where({ name: "Alice" }).update({ email: "alice@updated.com" });
    const [row] = await db("users").where({ name: "Alice" });
    expect(row.email).toBe("alice@updated.com");
  });

  it("deletes rows", async () => {
    await db("users").insert({ name: "ToDelete" });
    const deleted = await db("users").where({ name: "ToDelete" }).del();
    expect(deleted).toBe(1);

    const rows = await db("users").where({ name: "ToDelete" });
    expect(rows.length).toBe(0);
  });
});

describe("returning clause", () => {
  it("returns id on insert", async () => {
    const result = await db("users")
      .insert({ name: "Returning1", email: "r1@test.com" })
      .returning("id");
    expect(result.length).toBe(1);
    expect(result[0].id).toBeDefined();
  });

  it("returns multiple columns on update", async () => {
    await db("users").insert({ name: "Returning2", email: "r2@test.com" });
    const result = await db("users")
      .where({ name: "Returning2" })
      .update({ email: "r2@updated.com" })
      .returning(["id", "name"]);
    expect(result.length).toBe(1);
    expect(result[0].name).toBe("Returning2");
  });
});

describe("data types", () => {
  it("handles strings, integers, floats", async () => {
    await db("users").insert({ name: "TypeTest", age: 30, score: 9.5 });
    const [row] = await db("users").where({ name: "TypeTest" });
    expect(row.age).toBe(30);
    expect(row.score).toBeCloseTo(9.5);
  });

  it("handles booleans (stored as 0/1)", async () => {
    await db("users").insert({ name: "BoolTest", active: true });
    const [row] = await db("users").where({ name: "BoolTest" });
    expect(row.active).toBe(1);
  });

  it("handles dates (stored as valueOf)", async () => {
    const now = new Date();
    await db("users").insert({ name: "DateTest", created_at: now });
    const [row] = await db("users").where({ name: "DateTest" });
    expect(row.created_at).toBe(now.valueOf());
  });

  it("handles nulls", async () => {
    await db("users").insert({ name: "NullTest" });
    const [row] = await db("users").where({ name: "NullTest" });
    expect(row.email).toBeNull();
  });

  it("handles blobs (Buffer)", async () => {
    const buf = Buffer.from("hello");
    await db("users").insert({ name: "BlobTest", avatar: buf });
    const [row] = await db("users").where({ name: "BlobTest" });
    expect(Buffer.isBuffer(row.avatar)).toBe(true);
    expect((row.avatar as Buffer).toString()).toBe("hello");
  });
});

describe("transactions — commit", () => {
  it("persists data after commit", async () => {
    await db.transaction(async (trx) => {
      await trx("users").insert({ name: "TxCommit" });
    });
    const rows = await db("users").where({ name: "TxCommit" });
    expect(rows.length).toBe(1);
  });
});

describe("transactions — rollback", () => {
  it("does not persist data after rollback", async () => {
    try {
      await db.transaction(async (trx) => {
        await trx("users").insert({ name: "TxRollback" });
        throw new Error("force rollback");
      });
    } catch {
      // expected
    }
    const rows = await db("users").where({ name: "TxRollback" });
    expect(rows.length).toBe(0);
  });
});

describe("transactions — nested savepoints", () => {
  it("supports nested savepoints", async () => {
    await db.transaction(async (trx) => {
      await trx("users").insert({ name: "TxOuter" });

      await trx.transaction(async (trx2) => {
        await trx2("users").insert({ name: "TxInner" });
      });
    });
    const outer = await db("users").where({ name: "TxOuter" });
    const inner = await db("users").where({ name: "TxInner" });
    expect(outer.length).toBe(1);
    expect(inner.length).toBe(1);
  });
});

describe("raw queries", () => {
  it("executes raw SQL", async () => {
    const result = await db.raw("SELECT 1 + 1 AS result");
    expect(result[0].result).toBe(2);
  });
});

describe("initCommands", () => {
  it("executes init commands on each new connection", async () => {
    const db2 = createLibsqlKnex({
      connection: {
        url: ":memory:",
        initCommands: ["PRAGMA foreign_keys = ON"],
      },
    });
    const [row] = await db2.raw("PRAGMA foreign_keys");
    expect(row.foreign_keys).toBe(1);
    await db2.destroy();
  });

  it("runs multiple init commands in order", async () => {
    const db2 = createLibsqlKnex({
      connection: {
        url: ":memory:",
        initCommands: ["PRAGMA foreign_keys = ON", "PRAGMA recursive_triggers = ON"],
      },
    });
    const [fk] = await db2.raw("PRAGMA foreign_keys");
    const [rt] = await db2.raw("PRAGMA recursive_triggers");
    expect(fk.foreign_keys).toBe(1);
    expect(rt.recursive_triggers).toBe(1);
    await db2.destroy();
  });

  it("throws when an init command is invalid", async () => {
    const db2 = createLibsqlKnex({
      connection: {
        url: ":memory:",
        initCommands: ["NOT VALID SQL !!!"],
      },
      pool: { min: 0 },
    });
    await expect(db2.raw("SELECT 1")).rejects.toThrow();
    await db2.destroy();
  });
});

describe("URL normalization", () => {
  it("accepts connection.url directly", async () => {
    const db2 = createLibsqlKnex({ connection: { url: ":memory:" } });
    await db2.schema.createTable("url_test", (t) => t.increments("id"));
    expect(await db2.schema.hasTable("url_test")).toBe(true);
    await db2.destroy();
  });

  it("converts filename to file: URL", async () => {
    const db2 = new ClientLibSQL({
      connection: { filename: ":memory:" },
    });
    const conn = db2.connectionSettings;
    expect(conn.url).toBe(":memory:");
    expect(conn.filename).toBe(":memory:");
    await db2.destroy();
  });

  it("sets filename from url when filename is absent", async () => {
    const db2 = new ClientLibSQL({
      connection: { url: ":memory:" },
    } as any);
    const conn = db2.connectionSettings;
    expect(conn.filename).toBe(":memory:");
    await db2.destroy();
  });
});

describe("transactions — programmatic commit/rollback", () => {
  it("resolves with the value passed to trx.commit()", async () => {
    const result = await db.transaction((trx) => {
      trx("users")
        .insert({ name: "ProgrammaticCommit" })
        .then(() => {
          trx.commit("custom-value");
        });
    });
    expect(result).toBe("custom-value");
    const rows = await db("users").where({ name: "ProgrammaticCommit" });
    expect(rows.length).toBe(1);
  });

  it("rejects with the error passed to trx.rollback()", async () => {
    const err = new Error("explicit rollback");
    await expect(
      db.transaction((trx) => {
        trx("users")
          .insert({ name: "ProgrammaticRollback" })
          .then(() => {
            trx.rollback(err);
          });
      }),
    ).rejects.toThrow("explicit rollback");
    const rows = await db("users").where({ name: "ProgrammaticRollback" });
    expect(rows.length).toBe(0);
  });
});

describe("transactions — doNotRejectOnRollback", () => {
  it("resolves (not rejects) when doNotRejectOnRollback is true", async () => {
    const result = await db.transaction(
      (trx) => {
        trx.rollback();
      },
      { doNotRejectOnRollback: true },
    );
    expect(result).toBeUndefined();
  });

  it("rejects when doNotRejectOnRollback is false and rollback is called without an error", async () => {
    await expect(
      db.transaction(
        (trx) => {
          trx.rollback();
        },
        { doNotRejectOnRollback: false },
      ),
    ).rejects.toThrow("Transaction rejected with non-error: undefined");
  });
});

describe("transactions — transactionProvider()", () => {
  it("supports deferred transaction pattern", async () => {
    const trxProvider = db.transactionProvider();
    const trx = await trxProvider();
    await trx("users").insert({ name: "TxProvider" });
    await trx.commit();
    const rows = await db("users").where({ name: "TxProvider" });
    expect(rows.length).toBe(1);
  });

  it("rolls back deferred transaction on trx.rollback()", async () => {
    const trxProvider = db.transactionProvider();
    const trx = await trxProvider();
    await trx("users").insert({ name: "TxProviderRollback" });
    await trx.rollback();
    const rows = await db("users").where({ name: "TxProviderRollback" });
    expect(rows.length).toBe(0);
  });
});

describe("transactions — nested savepoints (partial rollback)", () => {
  it("rolls back inner savepoint while outer transaction commits", async () => {
    await db.transaction(async (trx) => {
      await trx("users").insert({ name: "SavepointOuter" });

      try {
        await trx.transaction(async (trx2) => {
          await trx2("users").insert({ name: "SavepointInner" });
          throw new Error("rollback inner only");
        });
      } catch {
        // inner rolled back, outer continues
      }
    });

    expect((await db("users").where({ name: "SavepointOuter" })).length).toBe(1);
    expect((await db("users").where({ name: "SavepointInner" })).length).toBe(0);
  });
});

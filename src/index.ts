import KnexDefault from "knex";
import type { Knex } from "knex";
import ClientLibSQL from "./client-libsql.js";
import type { LibsqlConnectionConfig } from "./client-libsql.js";

export { default } from "./client-libsql.js";
export type { LibsqlConnectionConfig } from "./client-libsql.js";

export interface LibsqlKnexConfig extends Omit<Knex.Config, "client" | "connection"> {
  connection: LibsqlConnectionConfig;
}

export function createLibsqlKnex(config: LibsqlKnexConfig): Knex {
  // StaticConnectionConfig is a type alias (closed union), not an interface,
  // so it cannot be augmented to include LibsqlConnectionConfig.
  return KnexDefault({ ...config, client: ClientLibSQL } as unknown as Knex.Config);
}

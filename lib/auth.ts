import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { env } from "cloudflare:workers";
import * as schema from "../src/db/schema";
import { drizzle } from "drizzle-orm/d1";

export function createAuth(db: D1Database) {
  const drizzleDb = drizzle(db, { schema });
  return betterAuth({
    database: drizzleAdapter(drizzleDb, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
  });
}

export const auth = createAuth(env.DB);

export type Auth = ReturnType<typeof createAuth>;

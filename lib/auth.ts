import { betterAuth } from "better-auth";
import { env } from "cloudflare:workers";

export const auth = betterAuth({
  database: env.DB,
});

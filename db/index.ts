import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

async function getCloudflareEnv() {
  if (process.env.VERCEL === "1") {
    throw new Error(
      "Cloudflare bindings are unavailable in the Vercel preview. Use the primary Sites deployment for shared intelligence and original diagram storage.",
    );
  }

  const workers = await import("cloudflare:workers");
  return workers.env;
}

export async function getDb() {
  const env = await getCloudflareEnv();
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

export async function getD1() {
  const env = await getCloudflareEnv();
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Configure the DB binding before using shared intelligence records.",
    );
  }

  return env.DB;
}

export async function getStructureAssets() {
  const env = await getCloudflareEnv();
  if (!env.BD_ASSETS) {
    throw new Error(
      "Cloudflare R2 binding `BD_ASSETS` is unavailable. Configure the structure asset binding before storing original diagrams.",
    );
  }

  return env.BD_ASSETS;
}

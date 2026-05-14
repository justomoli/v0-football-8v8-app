/**
 * Ejecuta scripts/009_wipe_db_reset_players.sql contra Postgres (Supabase).
 * Lee DATABASE_URL del entorno o de `<raíz del proyecto>/.env.local`.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"
import { getDatabaseUrl, PROJECT_ROOT } from "./resolve-database-url.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const url = getDatabaseUrl()

if (!url) {
  console.error(`
No se encontró DATABASE_URL.

1. Supabase → Project Settings → Database
2. "Connection string" → pestaña URI (usa la contraseña de la base)
3. En la raíz del proyecto, archivo .env.local:
   DATABASE_URL=postgresql://postgres.[ref]:TU_PASSWORD@aws-0-....pooler.supabase.com:6543/postgres
   (${path.join(PROJECT_ROOT, ".env.local")})

Luego desde la raíz: pnpm db:wipe
`)
  process.exit(1)
}

const sqlPath = path.join(__dirname, "009_wipe_db_reset_players.sql")
const sql = fs.readFileSync(sqlPath, "utf8")

const useSsl = !/localhost|127\.0\.0\.1/.test(url)
const client = new pg.Client({
  connectionString: url,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
})

try {
  await client.connect()
  await client.query(sql)
  console.log("Listo: 009_wipe_db_reset_players.sql aplicado correctamente.")
} catch (err) {
  console.error("Error ejecutando SQL:", err.message)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}

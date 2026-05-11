/**
 * Ejecuta scripts/005_reset_players_kriko_justo.sql contra Postgres (Supabase).
 * Requiere DATABASE_URL en .env.local (Settings → Database → Connection string → URI).
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const url = process.env.DATABASE_URL?.trim()

if (!url) {
  console.error(`
No se encontró DATABASE_URL.

1. Supabase → Project Settings → Database
2. "Connection string" → pestaña URI (usa la contraseña de la base)
3. En .env.local añade:
   DATABASE_URL=postgresql://postgres.[ref]:TU_PASSWORD@aws-0-....pooler.supabase.com:6543/postgres

Luego: pnpm db:reset-players
`)
  process.exit(1)
}

const sqlPath = path.join(__dirname, "005_reset_players_kriko_justo.sql")
const sql = fs.readFileSync(sqlPath, "utf8")

const useSsl = !/localhost|127\.0\.0\.1/.test(url)
const client = new pg.Client({
  connectionString: url,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
})

try {
  await client.connect()
  await client.query(sql)
  console.log("Listo: 005_reset_players_kriko_justo.sql aplicado correctamente.")
} catch (err) {
  console.error("Error ejecutando SQL:", err.message)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}

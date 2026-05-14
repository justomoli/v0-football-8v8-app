/**
 * DATABASE_URL desde el entorno o desde `<raíz>/.env.local` (raíz = carpeta padre de scripts/).
 * Así `pnpm db:wipe` no depende del cwd ni de `node --env-file` relativo.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const PROJECT_ROOT = path.join(__dirname, "..")

function parseDatabaseUrlFromFile(filePath) {
  if (!fs.existsSync(filePath)) return ""
  const text = fs.readFileSync(filePath, "utf8")
  for (const line of text.split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    if (!t.startsWith("DATABASE_URL")) continue
    const eq = t.indexOf("=")
    if (eq === -1) continue
    let val = t.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    return val.trim()
  }
  return ""
}

export function getDatabaseUrl() {
  const fromEnv = process.env.DATABASE_URL?.trim()
  if (fromEnv) return fromEnv
  return parseDatabaseUrlFromFile(path.join(PROJECT_ROOT, ".env.local"))
}

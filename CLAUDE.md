---
name: futjueves-context
description: |
  Onboarding y contexto del proyecto FUTJUEVES (a.k.a. Fulbito SB5 — Jueves 20hs).
  Mini-app Next.js 16 App Router para gestionar el fútbol 8v8 de los jueves
  entre amigos: parser de listas WhatsApp, matchmaker con snake-draft balanceado,
  carga de resultados, estadísticas históricas, cartas FIFA de jugadores y
  generador de mensajes WhatsApp para compartir.

  Usar este doc cuando: trabajes en el repo, retomes la sesión, agregues
  features manteniendo coherencia visual, o necesites saber qué decisiones
  ya están tomadas (no re-discutir).
metadata:
  priority: 9
  scope: project
  docs:
    - https://nextjs.org/docs/app
    - https://supabase.com/docs
  pathPatterns:
    - "app/**"
    - "components/**"
    - "lib/**"
    - "scripts/**"
---

# FUTJUEVES · Contexto del proyecto

## 1. Stack & decisiones inamovibles

| Capa | Elección | Notas |
|---|---|---|
| Framework | **Next.js 16.2** (App Router) | Páginas son client components — la app es 100% interactiva |
| UI | **React 19** + **TypeScript 5.7** | Strict mode |
| Estilos | **Tailwind CSS 4.2** + **shadcn/ui** (radix-based) | Tailwind v4 syntax (`@theme inline` en globals.css) |
| Auth/DB | **Supabase** (`@supabase/ssr`) | Single client en `lib/supabase/client.ts` |
| Estado | React state local + auth context. **No Redux/Zustand fuera del context** |
| Fuentes | **Plus Jakarta Sans** (body), **Syne** (display), **JetBrains Mono** (números) | Cargadas via `next/font/google` en `app/layout.tsx` |
| Iconos | **lucide-react** | Nunca emoji decorativos en UI fija |
| Package manager | **pnpm** | hay `pnpm-lock.yaml` |
| Analytics | `@vercel/analytics` (solo en prod) |

### Comandos
```bash
pnpm dev      # localhost:3000
pnpm build    # verificación obligatoria antes de push
pnpm lint     # si está configurado
```

### Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 2. Arquitectura de rutas (App Router)

El app es multi-página real, **no SPA**. Reload preserva la ruta.

```
app/
  layout.tsx          → root: fonts + <AppShell>
  page.tsx            → /            (HomeDashboard)
  jugadores/page.tsx  → /jugadores   (WhatsAppParser)
  plantel/page.tsx    → /plantel     (PlayersRoster)
  equipos/page.tsx    → /equipos     (Matchmaker)
  partido/page.tsx    → /partido     (PostMatch)
  stats/page.tsx      → /stats       (StatsDashboard)
  ajustes/page.tsx    → /ajustes     (AdminPanel)
```

### `components/app-shell.tsx` — wrapper compartido
Renderiza en TODA ruta:
- `AuthProvider` (lib/auth-context.tsx)
- `Background` (blobs animados + pitch grid + vignette)
- `Header` (logo F8 clickable → `/`, player chip)
- `ScrollResetOnRoute` (window.scrollTo top en cada cambio de pathname)
- `AuthGate` → muestra `PlayerLogin` si `!player`, sino los children
- `Navigation` (bottom floating)

### `components/navigation.tsx`
Usa `<Link prefetch>` + `usePathname()` para estado activo. **No hay prop drilling de tabs**. Para agregar una sección nueva: agregás la ruta a `lib/routes.ts` y un item al array `tabs` de navigation.

### `lib/routes.ts` — fuente de verdad
```ts
export const ROUTES = {
  home: "/", parser: "/jugadores", players: "/plantel",
  matchmaker: "/equipos", postmatch: "/partido",
  stats: "/stats", admin: "/ajustes",
}
```
Usá `routeFor(key)` cuando necesités convertir un id de tab → path (ej: `HomeDashboard.onNavigate`).

---

## 3. Sistema de diseño

### Paleta (todo en oklch)
| Token | Valor | Uso |
|---|---|---|
| Bg base | `oklch(0.09 0.016 260)` | fondo app |
| Primary (verde neón) | `oklch(0.78 0.22 145)` | acentos, CTAs, "Crack" tier |
| Cyan | `oklch(0.78 0.15 195)` | "Titular" tier (rating 6-8) |
| Amber/gold | `oklch(0.85 0.18 80)` | Superclásico, MOTM, "Icon" tier |
| Red | `oklch(0.7 0.2 25)` | Destructive, "Refuerzo" tier (<4) |

**Nunca usar:** purple gradients, hex colors hardcoded en componentes (usar oklch).

### Rating tiers (`lib/rating-tier.ts`)
Helper centralizado `tierColor(r)`:
- `r ≥ 9` → **Icon** (gold)
- `r ≥ 8` → **Crack** (green)
- `r ≥ 6` → **Titular / Bueno** (cyan)
- `r ≥ 4` → **Estándar / Promedio** (amber)
- `r < 4` → **Refuerzo / Reserva** (gray-red)

Cada player row/card usa este color como stripe vertical accent, glow, text-shadow.

### Tipografía
- `--font-jakarta` (sans, body): texto general, nombres
- `--font-syne` (display): títulos grandes, `font-display` utility
- `--font-jetbrains` (mono): **TODOS los números** — ratings, scores, countdowns, jersey numbers, stats, fechas

### Utilities globales (`app/globals.css`)
| Class | Uso |
|---|---|
| `.glass` | card translúcida con blur |
| `.glass-strong` | dialog overlay, más blur |
| `.glass-dock` | nav inferior |
| `.eyebrow` | label uppercase 11px mono tracking 0.08em |
| `.eyebrow-sub` | subtítulo 13px sans line-height 1.4 |
| `.meta-label` | label muy chico mono 10px tracking 0.1em |
| `.display-num` | número grande Geist Mono 600 |
| `.tabular` | tabular-nums |
| `.anim-fade-up`, `.anim-fade-down`, `.anim-scale-in` | enters |
| `.delay-1` a `.delay-3` | stagger |
| `.neon-border` | border verde con glow |
| `.pitch-grid` | textura de cancha (líneas) |
| `.blob-green`, `.blob-cyan`, `.blob-small` | blobs animados del bg |

### Patrón de carta / row de jugador
```
[stripe vertical tier] [avatar inicial o foto] [nombre + meta] [rating mono] [actions]
```
- Stripe: 3px ancho, `boxShadow: 0 0 10px ${tier}A0`
- Hover: `translate-x-[1px]`
- Rating: Geist Mono semibold + `text-shadow` color del tier

---

## 4. Componentes clave y dónde tocar

### `components/home-dashboard.tsx`
Landing default. Secciones (en orden):
- HeroCountdown — countdown al próximo jueves 20:00
- SmartAction — CTA contextual según `current_match_setup`
- MyStats — card del player logueado (click → abre FIFA card propia)
- LastMatch — recap del partido más reciente
- Leaders — top goleador + top MOTM season

Loading state: `LoadingState` (delayMs 380).

### `components/player-fifa-card.tsx`
Estética **"stadium pass"**: rating top-left grande, foto enmarcada con corner brackets, nombre uppercase, posición, **bio editable** (textarea, max 200 chars), footer stats scoreboard, watermark F8 · #ID.

**Funcionalidades:**
- Editor inline de bio (Pencil → textarea + Cancel/Guardar)
- Upload de foto via cámara icon → `lib/image-upload.ts` → Supabase Storage bucket `player-photos`
- Tier-based theming (gradient, border, accent)

**Lo que NO tiene** (decisión deliberada): editor de pace/shot/passing/etc., editor de height/weight, editor de rating directo. El rating es derivado de partidos.

### `components/team-share-card.tsx`
Flyer para WhatsApp. NO muestra promedios, totales ni diferencias (info interna del Matchmaker). Solo nombres + tier stripe + GK badge si aplica. Botones Descargar/Copiar usan `html-to-image` → PNG 2x pixel ratio.

### `components/match-detail-drawer.tsx`
Dialog que abre al hacer click en un partido del historial en Stats. Muestra score grande, MOTM, y ambas listas (Blanco / Negro) con goles + rating de ese partido específico. Datos vía `getMatchStats(matchId)`.

### `components/post-match.tsx` — flujo de save
1. Cargar `current_match_setup` (equipos del Matchmaker)
2. Inputs por jugador: goles + rating (1-10)
3. Toggle Superclásico (con animación fuegos artificiales — keyframes en globals.css)
4. Toggle MOTM
5. **`handleSaveMatch`**:
   - `saveMatchWithStats(...)` (lib/db.ts)
   - **Aplica goal bonus**: `effectiveRating = rating + min(goals * 0.3, 1.5)`, cap 10
   - Guarda en `player_ratings` el effectiveRating (no el match_rating crudo)
   - Recalcula `dynamic_rating` como avg de todos los ratings históricos del jugador
   - `clearMatchSetup()` → vacía equipos en BD
   - Builds WhatsApp message via `lib/match-message.ts`
6. **Pantalla `saved`**: recap + botones "Copiar mensaje WhatsApp" y "Nuevo partido"

### `components/admin-panel.tsx`
Sección Ajustes. Edit player guarda con loading state (spinner en botón + error inline). NO tiene editor de stats físicas (decisión).

### `components/ui/spinner.tsx`
Logo **F8 sports stencil-cut**:
- Italic skew (-7°)
- Notch chamfered en top-right de la F
- 8 como dos donuts (evenodd fill-rule)
- Diagonal slash via SVG mask (rotate -9°)
- Trace + spark animation (CSS keyframes en globals.css)

`LoadingState`:
- `delayMs` default 380 (cargas <380ms no muestran overlay)
- Lock de body scroll + touchAction mientras visible
- `contentCentered` (default true): aplica `pt-10 pb-40` para compensar header + nav y centrado óptico

**Nunca usar el logo de Vercel/Next** — fue lo que había antes, fue reemplazado por F8.

---

## 5. Modelo de datos & migraciones

### Player (`lib/types.ts`)
```ts
{
  id, name, dynamic_rating, total_goals, total_matches, motm_count,
  is_admin, is_goalkeeper?, bio?,
  // Perfil opcional (estaba para FIFA card; ahora solo bio se edita):
  height_cm?, weight_kg?, position?, shot?, pace?, passing?,
  dribbling?, defense?, physique?, photo_url?, nickname?,
  created_at, updated_at
}
```

### Migraciones SQL (`scripts/*.sql`)
Orden cronológico:
1. `001_create_schema.sql` — tablas base
2. `002_seed_data.sql` — jugadores demo (Messi, Ronaldo, etc.)
3. `003_add_goalkeeper.sql` — `is_goalkeeper boolean`
4. `004_player_profile.sql` — campos físicos/stats/photo_url (aunque el editor se sacó, las cols quedan)
5. `005_cleanup_players.sql` — borra demos, deja Justo y Kriko (ajustar nombres antes de correr)
6. `006_player_bio.sql` — `bio TEXT`
7. `007_storage_bucket.sql` — bucket `player-photos` con read/write público

### Auth (`lib/auth-context.tsx`)
Dos modos:
- **Jugador BD**: token en `localStorage.AUTH_TOKEN_KEY`, sesión real
- **Invitado**: `localStorage.GENERAL_SESSION_KEY` con nombre, player "fake" id `general-user`

Fallback de nombre: **"Invitado"** (NO usar roasts/demoralizing — ya hay migración auto que limpia los viejos como "suplente emocional", "pecho frío", etc. del localStorage).

### Snake-draft de equipos (`components/matchmaker.tsx`)
Orden confirmados sorteados por `dynamic_rating` desc, asignar 1-1-2-2-1-1-2-2... Garantiza equipos balanceados sin necesidad de optimizador.

---

## 6. Reglas de UX/estética (DON'TS)

❌ **No** frases demoralizadoras, roasts, mensajes irónicos en UI fija
❌ **No** logo de Vercel ni triangulito Next.js — solo F8 sports-cut
❌ **No** emoji decorativos en UI fija (sí en mensaje WhatsApp, ahí va)
❌ **No** purple gradients ni paletas violeta
❌ **No** font Inter/Roboto/Arial — la pareja es Jakarta + Syne + JetBrains Mono
❌ **No** shadcn `<Card>` con `bg-card/50` — usar `.glass` rounded-2xl
❌ **No** mostrar promedios/totales/diferencia en imagen de equipos (info interna)
❌ **No** editor de stats físicas (pace/shot/etc.) en FIFA card — fue removido a propósito
❌ **No** rating editable directo en UI (el rating se deriva de partidos)

✓ **Sí** usar `.eyebrow` para todos los section labels
✓ **Sí** usar Geist Mono para todos los números
✓ **Sí** loading state visible con spinner para cualquier acción async (>200ms)
✓ **Sí** `clearMatchSetup()` después de cualquier save de match
✓ **Sí** tier color helper centralizado (`lib/rating-tier.ts`)

---

## 7. Patterns rápidos de copy-paste

### Section header con eyebrow
```tsx
<div className="glass rounded-2xl p-5 anim-fade-up">
  <div className="flex items-start gap-3 mb-4">
    <div className="shrink-0 h-10 w-10 rounded-xl flex items-center justify-center"
      style={{ background: "...", border: "1px solid ..." }}>
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <div className="flex-1 pt-0.5">
      <h2 className="eyebrow mb-1.5">Título</h2>
      <p className="eyebrow-sub">Subtítulo descriptivo.</p>
    </div>
  </div>
  {/* contenido */}
</div>
```

### Number display (Geist Mono)
```tsx
<span style={{
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  fontSize: 18,
  fontWeight: 600,
  color: tier,
  letterSpacing: "-0.04em",
  textShadow: `0 0 8px ${tier}55`,
}} className="tabular-nums">
  {value}
</span>
```

### Player row con stripe
```tsx
<div className="group relative overflow-hidden rounded-xl border ...">
  <div className="absolute left-0 top-0 bottom-0 w-[3px]"
    style={{ background: tier, boxShadow: `0 0 10px ${tier}A0` }} />
  <div className="flex items-center gap-2.5 pl-3 pr-2 py-2">
    {/* rating chip, name, meta, actions */}
  </div>
</div>
```

### Async action con loading
```tsx
const [saving, setSaving] = useState(false)
const [error, setError] = useState<string | null>(null)

const handleAction = async () => {
  setSaving(true)
  setError(null)
  try {
    await dbCall()
  } catch (e) {
    setError(e instanceof Error ? e.message : "Falló.")
  } finally {
    setSaving(false)
  }
}

<Button onClick={handleAction} disabled={saving} className="gap-2">
  {saving ? <><Spinner className="h-4 w-4" /> Guardando…</> : "Guardar"}
</Button>
{error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[12px] text-destructive/90">{error}</div>}
```

---

## 8. Workflow git

- Branch principal: `main`
- Commits en español, prefijo `feat:` / `fix:` / `chore:`
- Co-author: `Claude Opus 4.7 <noreply@anthropic.com>`
- Push directo a main (es proyecto chico)
- Antes de cada push: **`pnpm build`** obligatorio para verificar TS + Next compile

---

## 9. TODOs / próximos pasos sugeridos

- [ ] Correr migraciones 005-007 en Supabase de producción si todavía no se hizo
- [ ] Subir las fotos de los jugadores al bucket `player-photos` (path: `<player_id>.jpg`)
- [ ] Permission gate: solo el propio jugador (o admin) puede editar su bio
- [ ] Sistema de notificaciones push para el jueves
- [ ] PWA / Add to home screen

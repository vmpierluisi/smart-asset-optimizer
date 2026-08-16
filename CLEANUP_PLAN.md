# Smart Asset Optimizer — Portfolio Cleanup Plan

## Context

`smart-asset-optimizer` is a Vite + React + TypeScript + shadcn/ui app (portfolio optimizer, stock analysis, market news) originally scaffolded in Lovable. It's being cleaned up to serve as a **portfolio piece**. Two forcing functions:

1. **The Supabase project is dead and unrecoverable** — it must be recreated from scratch (auth, tables, RLS, edge functions, secrets). The frontend even hardcodes the old project URL (`hymucchmkpgemxcxngpe.supabase.co`) in several places.
2. **The API layer is a mess** — it juggles **6 external providers** (Twelve Data, Alpha Vantage, FMP, Marketaux, OpenAI, OpenRouter) with heavy duplication, dead code, and several frontend calls to edge functions **that don't exist** in the repo.

Intended outcome: a clean, consistent, runnable-by-reviewers repo with a unified API client (minimal provider set + a keyless **mock/demo mode**), a **deep refactor** of the god-components, working **light + dark** theming, a properly recreated Supabase backend with **full auth kept**, and a real README.

> Decisions confirmed with the user: (1) consolidate providers + add mock mode; (2) deep refactor; (3) keep full auth (recreate auth + tables + RLS); (4) finish both light and dark themes.

> **Note:** During plan mode this lives in `~/.claude/plans/`. Execution step 0 is to also commit it to the repo root as `CLEANUP_PLAN.md` (per the original request) and track progress against it.

---

## Audit findings (evidence)

### 🔴 Broken / bugs
- **Dead Supabase project + hardcoded URL.** `src/utils/newsUtils.ts` hardcodes `https://hymucchmkpgemxcxngpe.supabase.co/functions/v1/...` in 4 places (lines 106, 150, 292, 373) instead of using `VITE_SUPABASE_URL`. Everything is broken until a new project exists.
- **Frontend calls edge functions that don't exist in the repo:** `financial-health`, `historical-prices`, `macd-analysis`, `risk-analysis`, `stock-quote`, `technical-indicators`. Referenced from `src/utils/fmpFinanceUtils.ts` and `src/hooks/usePortfolioOptimization.ts` (`historical-prices` → the **portfolio optimizer is non-functional**).
- **DB schema mismatch.** The only migration (`supabase/migrations/20240620_create_user_profiles.sql`) creates `user_profiles`, which the app **never queries**. The app actually reads/writes `user_preferences` and `watchlist` (`src/pages/Settings.tsx`) — **neither has a migration**. Sign-up writes profile fields to `auth.users` metadata, not to `user_profiles`.
- **Dark mode is dead.** `tailwind.config.ts` sets `darkMode: ["class"]` and `next-themes` is installed, but there is **no `.dark` token block** in `src/index.css`, **no ThemeProvider, and no toggle**. Dark mode does nothing.

### 🟠 API mess / duplication
- **6 providers.** Edge-function secrets referenced: `TWELVE_DATA_API_KEY`, `ALPHA_VANTAGE_API_KEY`, `FMP_API_KEY`, `MARKETAUX_DATA_API_KEY`, `OPENAI_API_KEY`, `OPENROUTER_API_KEY`.
- **~30 edge functions, many copy-paste.** `twelve-sma-20/50/200` and `twelve-ema-20/50/200` are **6 near-identical 143-line files** differing only in `ma_type` + `time_period`. Overlapping news functions: `news-market`, `news-general`, `news-breaking`, `news-sentiment`. Overlapping portfolio functions: `analyze-portfolio`, `analyze-portfolio-metrics`, `analyze-portfolio-stocks`, `analyze-portfolio-performance`.
- **Duplicate client fetchers.** `src/utils/twelveDataUtils.ts` (2,278 lines) has 6 near-identical `fetchSMA20/50/200` + `fetchEMA20/50/200` (~124 lines each).
- **Dead util files.** `src/utils/yahooFinanceUtils.ts` (0 imports) and `src/utils/alphavantageUtils.ts` (0 imports) are dead; the latter also has its interfaces **declared twice** in one file. `src/utils/fmpFinanceUtils.ts` (717 lines) targets the missing FMP edge functions → largely dead.
- **No use of `supabase.functions.invoke`.** 44 raw `fetch('${url}/functions/v1/...')` calls re-read env vars and re-implement auth headers/error handling each time. Zero use of the supabase-js client for functions.
- **`fetchStockStatistics`, `searchStocks` duplicated** across `fmpFinanceUtils` and `yahooFinanceUtils`/`twelveDataUtils`.

### 🟠 Structure / maintainability
- **`src/pages/StockAnalysis.tsx` is 4,610 lines** — 68 `useState`, 33 `useEffect`, 34 imports. Single god-component.
- **`twelveDataUtils.ts` (2,278 lines)** mixes fetching with analysis logic (`analyzeMACDSignals`, `getRecentMACDSignals`).
- **App shell is awkward** — `src/App.tsx` nests `w-screen h-screen overflow-hidden` → `w-screen h-screen overflow-auto` → `pr-10` wrappers.
- **TS is fully non-strict** — `strict:false`, `strictNullChecks:false`, `noImplicitAny:false`, `allowJs:true` across `tsconfig.json` / `tsconfig.app.json`.

### 🟡 UI / consistency
- **Inconsistent page containers.** `StockAnalysis` uses `container mx-auto p-4`; `Profile`/`Settings` use `container max-w-3xl py-10`; `MarketNews` is card/full-width; `LandingPage` is `min-h-screen`. No shared page-layout primitive.
- **~50 hardcoded hex colors** in chart/gauge components (`#ef4444`, `#10b981`, `#ff9999`, `#8884d8`, …) instead of CSS variables → breaks theming and consistency.
- **Chart component sprawl.** `SMAChart` (627) and `EMAChart` (629) are near-duplicates; `RSIChart` (562), `MACDChart` (463), `CandlestickChart` (423). Gauges: `DailyRangeGauge`, `WeekRangeGauge`, `PriceRangeGauge`, `GaugeChart` overlap. `MockChart.tsx` (19 lines) looks like a leftover placeholder.
- **328 `console.*` calls in `src/`**, 185 in edge functions — noisy for production/portfolio.
- Google Fonts loaded via CSS `@import` (render-blocking external request).

### 🟡 Repo hygiene
- README is **default Lovable boilerplate** (links to lovable.dev, no real description/screenshots/setup).
- `package.json` name is still `vite_react_shadcn_ts`; `lovable-tagger` dev dep + `lovable-tagger` in `vite.config.ts`.
- **Two lockfiles:** `bun.lockb` **and** `package-lock.json`. Pick one.
- Tracked junk: `supabase/.temp/cli-latest`, `supabase/.branches/_current_branch`. Untracked junk in tree: `timeseries_acf.png` (root), scattered `.DS_Store`. (`dist/` is present locally but **not** tracked — good.)
- `.gitignore` covers `.env` — **no secrets are committed** (verified). Local `.env` files exist and are ignored.

---

## Plan

### Phase 0 — Baseline & hygiene
- Commit this plan as `CLEANUP_PLAN.md` in repo root.
- Remove tracked junk (`supabase/.temp`, `supabase/.branches`), delete `timeseries_acf.png`, purge `.DS_Store`; extend `.gitignore` (`.DS_Store`, `supabase/.temp/`, `supabase/.branches/`, `dist/`).
- **Choose one package manager** (recommend npm → keep `package-lock.json`, delete `bun.lockb`).
- Rename package in `package.json` to `smart-asset-optimizer`; remove `lovable-tagger` (dep + `vite.config.ts` usage).
- Add `.env.example` documenting every var (frontend + edge secrets).

### Phase 1 — Recreate Supabase from scratch
Use the Supabase MCP tools (`create_project`, `apply_migration`, `deploy_edge_function`, `get_project_url`, `get_publishable_keys`, `get_advisors`).
- Create a new project; capture project URL + publishable/anon key.
- **Author real migrations** for the tables the app actually uses:
  - `user_preferences` and `watchlist` (shapes derived from `src/pages/Settings.tsx` usage) with **RLS keyed on `auth.uid()`**.
  - Reconcile `user_profiles`: either wire it up (insert on sign-up via a trigger on `auth.users`) or drop it. Recommend a `handle_new_user()` trigger that populates `user_profiles` from sign-up metadata, `id` FK → `auth.users(id)`, and RLS keyed on `auth.uid()` (current migration keys on `email = auth.email()` and lacks the trigger).
- Run `get_advisors` (security + performance) and fix flagged RLS/index issues.
- Set edge-function secrets for the **consolidated** provider set only.
- Update `.env` (local) + deployment env; **remove hardcoded project URLs** in `newsUtils.ts`.

### Phase 2 — Unified API layer (the core cleanup)
**Frontend — one client.** Create `src/lib/apiClient.ts` (or `src/utils/api/`) that wraps `supabase.functions.invoke(name, { body })`, centralizing auth/error handling/typing. Replace all 44 raw `fetch('/functions/v1/...')` calls. Delete per-file env re-reads.

**Consolidate providers** to the minimal set that still covers every UI surface (some data isn't available from a single provider, so keep a small principled set):
- **Market data + indicators:** Twelve Data (primary, most complete here).
- **News:** one provider — pick Marketaux **or** Alpha Vantage news, delete the other.
- **AI analysis:** one provider — recommend **OpenRouter** (flexible/cheaper) or OpenAI; delete the other.
- **Delete FMP entirely** (its edge functions don't exist; `fmpFinanceUtils.ts` is dead).

**Parameterize duplicated edge functions:**
- Collapse `twelve-sma-20/50/200` + `twelve-ema-20/50/200` → **one** `twelve-moving-average` taking `{ symbol, ma_type, time_period }`. Mirror on the client: one `fetchMovingAverage(symbol, maType, period)` replacing the 6 `fetchSMA*/fetchEMA*`.
- Consolidate the 4 `analyze-portfolio*` functions into one (or a clearly-scoped few); same for the news functions where they overlap.
- Standardize a shared response/error contract; keep `_shared/cors.ts` (consider tightening `Access-Control-Allow-Origin` from `*`).

**Mock / demo mode (keyless):** promote the existing `VITE_USE_LOCAL_STOCK_DATA` idea (currently only in `yahooFinanceUtils`) into a first-class flag honored by the unified client. When on (or when keys are absent), serve realistic fixture data for prices, indicators, news, and AI so reviewers can run the app with **zero API keys**. Store fixtures under `src/mocks/`.

**Delete dead code:** `yahooFinanceUtils.ts`, `alphavantageUtils.ts`, `fmpFinanceUtils.ts`, and the frontend references to `financial-health`/`historical-prices`/`macd-analysis`/`risk-analysis`/`stock-quote`/`technical-indicators` (re-point the optimizer's `historical-prices` call to the Twelve Data time-series function).

### Phase 3 — Deep component refactor
- **`StockAnalysis.tsx` (4,610 → decomposed):** split into feature sections (overview/quote, price & candlestick, indicators, statistics, AI panel, watchlist actions) as child components under `src/components/stock-analysis/`, each backed by a focused react-query hook. Lift the ~68 `useState` into a handful of hooks/reducers. Target: page file becomes a thin composition (<300 lines).
- **`twelveDataUtils.ts` (2,278):** separate pure analysis (`analyzeMACDSignals`, etc.) into `src/utils/indicators.ts`; move fetchers behind the unified client; drop the collapsed MA fetchers.
- **Charts:** extract a shared base for `SMAChart`/`EMAChart` (near-identical); consolidate the 3 range gauges + `GaugeChart` into one configurable gauge; **delete `MockChart.tsx`** if unused.
- **Hooks:** standardize on react-query across `useStockPrices`, `useStockStatistics`, `useTimeSeries`, `useRsi`, `usePortfolioAnalysis`, `usePortfolioOptimization`; resolve `usePortfolioAnalysis` vs `usePortfolioAnalysisParsed` duplication.
- **App shell:** simplify `src/App.tsx` nesting; introduce a `PageContainer` layout primitive and apply it to every page for consistent width/padding/header.

### Phase 4 — Theming (light + dark)
- Add a `.dark { ... }` token block in `src/index.css` mirroring `:root`.
- Add a `next-themes` `ThemeProvider` (in `App.tsx`/`main.tsx`) + a toggle in `UserMenu`/`AppSidebar`.
- Migrate the ~50 hardcoded chart/gauge hex colors to CSS variables (add semantic chart tokens: `--chart-up`, `--chart-down`, `--chart-line`, etc.) so both themes render correctly.
- Verify every page/component in both themes.

### Phase 5 — Consistency, quality, docs
- Tighten TS: enable `strict` (or at least `strictNullChecks` + `noImplicitAny`), turn on `noUnusedLocals`/`noUnusedParameters`; fix the fallout incrementally.
- Strip debug `console.*` (keep meaningful `console.error`); ensure `npm run lint` passes.
- Replace render-blocking Google Fonts `@import` with a `<link rel="preconnect">`/font strategy (or self-host).
- **Rewrite `README.md`:** real project description, feature list, screenshots/GIF, tech stack, architecture (frontend ↔ edge functions ↔ providers), local setup (mock mode first, then real keys), Supabase setup, deployment. Remove all Lovable references.
- Add a short `ARCHITECTURE.md` or diagram (optional but strong for a portfolio).

---

## Critical files
- **API:** `src/lib/supabase.ts`, new `src/lib/apiClient.ts`, `src/utils/twelveDataUtils.ts`, `src/utils/newsUtils.ts`, `src/utils/aiApiClient.ts`; delete `src/utils/{fmpFinanceUtils,yahooFinanceUtils,alphavantageUtils}.ts`.
- **Edge functions:** collapse `supabase/functions/twelve-{sma,ema}-*` → `twelve-moving-average`; consolidate `news-*` and `analyze-portfolio*`; `supabase/functions/_shared/cors.ts`.
- **Refactor targets:** `src/pages/StockAnalysis.tsx`, `src/components/{SMAChart,EMAChart,RSIChart,MACDChart,*Gauge}.tsx`, `src/App.tsx`, `src/hooks/*`.
- **Migrations:** new files under `supabase/migrations/` for `user_preferences`, `watchlist`, and reconciled `user_profiles` + `handle_new_user` trigger.
- **Config:** `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `.gitignore`, new `.env.example`, `README.md`.

## Reuse (don't reinvent)
- shadcn/ui primitives in `src/components/ui/*` and `cn()` in `src/lib/utils.ts`.
- Existing react-query setup in `src/App.tsx`; `AuthProvider`/`useAuth` in `src/lib/auth.tsx`; `ProtectedRoute`.
- `next-themes` (already installed) for the theme provider.
- `supabase.functions.invoke` from the already-installed `@supabase/supabase-js` client.
- Existing `VITE_USE_LOCAL_STOCK_DATA` flag concept for mock mode.

## Verification
1. **Mock mode first:** with no API keys and `VITE_USE_LOCAL_STOCK_DATA=true`, `npm run dev` → every page (landing, optimizer, stock analysis, market news) renders with fixture data; no console errors; no calls to the dead project URL.
2. **Real backend:** point `.env` at the new Supabase project; sign up → confirm a `user_profiles` row is created and `watchlist`/`user_preferences` read/write works under RLS (and cross-user access is denied).
3. **Edge functions:** exercise `twelve-moving-average` (SMA + EMA, all periods), time-series, quote, news, and AI streaming from the UI; confirm the portfolio optimizer works (no `historical-prices` 404).
4. **Providers:** grep confirms only the consolidated provider secrets remain referenced; no references to deleted utils or missing functions.
5. **Theming:** toggle light/dark on every page; charts use tokens and read correctly in both.
6. **Quality gates:** `npm run lint` clean; `npx tsc --noEmit` passes under the tightened config; `npm run build` succeeds.
7. Run Supabase `get_advisors` (security + performance) → no unresolved high-severity findings.

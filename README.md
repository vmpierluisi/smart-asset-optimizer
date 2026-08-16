# Smart Asset Optimizer

A full-stack investment-analysis web app: search any stock for a deep technical + fundamental breakdown, build and optimize a portfolio with modern-portfolio-theory math, and skim market news — with optional AI explanations of every metric.

Built with React + TypeScript on the front end and Supabase (Postgres, Auth, Edge Functions) on the back end, consolidated onto a small, clean set of market-data providers.

> **Run it in 60 seconds with zero API keys** — the app ships with a built-in **mock mode** that serves realistic, deterministic fixture data, so you can explore every feature without a backend or provider account. See [Quick start](#quick-start).

## Features

- **Stock Analysis** — real-time quote, candlestick/line price chart, and per-section analysis: moving averages (SMA/EMA 20/50/200), RSI, MACD with signal detection, valuation ratios, financial health, earnings history, analyst ratings, price targets, dividends, news sentiment, and a risk breakdown (beta, volatility, VaR, max drawdown).
- **Portfolio Optimizer** — mean-variance optimization over a chosen basket of stocks (expected return, volatility, VaR/ES), computed client-side with `mathjs`.
- **Market News** — market-wide and per-ticker news with sentiment.
- **AI explanations** — an "explain this" popup on each analysis card streams a plain-English explanation of the metrics in context.
- **Accounts** — email/password auth, a personal watchlist, and saved preferences, all protected by row-level security.

## Architecture

```
React (Vite) ──► useQuery hooks ──► invokeFunction()  ──►  Supabase Edge Functions  ──►  Data providers
  UI + charts     (react-query      (one unified client   (Deno; one per endpoint)      • Twelve Data (market data,
                   data layer)        wrapping                                             indicators, fundamentals)
                                      supabase.functions)                                • Marketaux (news)
                                                                                         • OpenRouter (AI)
        │                                   │
        └─ Mock mode short-circuits here ───┘   Supabase Postgres + Auth + RLS
           (bundled fixtures, no network)       (user_profiles, user_preferences, watchlist)
```

- **One API client.** Every backend call goes through `invokeFunction(name, body)` in [`src/lib/apiClient.ts`](src/lib/apiClient.ts), which wraps `supabase.functions.invoke`, centralizes auth/error handling, and transparently swaps in fixture data when mock mode is on.
- **react-query as the data layer.** Feature sections read from lazy `useQuery` hooks ([`src/hooks/stock-analysis/queries.ts`](src/hooks/stock-analysis/queries.ts)); below-the-fold sections defer their fetch until scrolled into view, keeping request volume within provider rate limits.
- **Provider consolidation.** Market data, technical indicators, and fundamentals come from **Twelve Data**; news from **Marketaux**; AI from **OpenRouter**. Edge functions live in [`supabase/functions/`](supabase/functions/).

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · TanStack Query · Recharts / visx · mathjs · Supabase (Postgres, Auth, Edge Functions on Deno) · Vitest.

## Quick start

Requires Node.js 18+.

```bash
npm install
cp .env.example .env   # defaults to mock mode — no keys needed
npm run dev
```

Open http://localhost:8080. In mock mode you can browse everything immediately; protected pages (Optimizer, Stock Analysis, Market News) require an account, which you can create from the app.

## Running against live data

1. Create a Supabase project and apply the migration in [`supabase/migrations/`](supabase/migrations/) (`user_profiles` + a `handle_new_user` trigger, `user_preferences`, `watchlist`, all with RLS).
2. Deploy the edge functions in [`supabase/functions/`](supabase/functions/) and set the provider secrets:
   ```bash
   supabase secrets set TWELVE_DATA_API_KEY=… MARKETAUX_DATA_API_KEY=… OPENROUTER_API_KEY=…
   ```
3. In `.env`, set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` to your project and `VITE_USE_LOCAL_STOCK_DATA=false`.

> Twelve Data's free tier is rate-limited (~8 req/min). The app lazy-loads sections to stay within it; a paid tier removes the constraint. Mock mode has no limits.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server (port 8080) |
| `npm run build` | Production build |
| `npm test` | Run the Vitest unit suite |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | ESLint |

## Project layout

```
src/
  lib/apiClient.ts        Unified edge-function client + mock-mode switch
  mocks/                  Deterministic fixture generators for mock mode
  hooks/stock-analysis/   Lazy react-query data hooks + visibility gating
  utils/                  Provider-specific data transforms + indicator math
  components/             UI (shadcn/ui based) + charts
  pages/                  Routes (Stock Analysis, Optimizer, Market News, auth, …)
supabase/
  functions/              Deno edge functions (one per endpoint)
  migrations/             Postgres schema + RLS
```

# Stock Ratios Function

This Supabase Edge Function fetches valuation ratios data from Financial Modeling Prep API.

## Setup

1. Get an API key from [Financial Modeling Prep](https://site.financialmodelingprep.com/developer/docs)
2. Set the API key as an environment variable named `FMP_API_KEY` in the Supabase project.

## Deployment

Deploy using the Supabase CLI:

```
supabase functions deploy stock-ratios --project-ref your-project-ref
```

## Usage

Send a POST request to the endpoint with the stock symbol:

```
POST /functions/v1/stock-ratios
Content-Type: application/json
Authorization: Bearer SUPABASE_ANON_KEY

{
  "symbol": "AAPL"
}
```

## Response Format

```json
{
  "peRatio": "28.45",
  "forwardPE": "24.80",
  "pegRatio": "1.78",
  "priceToBook": "30.55",
  "priceToSales": "7.18",
  "evToEbitda": "17.92",
  "dividendYield": "0.50",
  "dividendGrowth5Y": "7.85",
  "fairValueLow": 160.00,
  "fairValueHigh": 210.00
}
``` 
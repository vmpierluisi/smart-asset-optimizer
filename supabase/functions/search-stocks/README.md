# Stock Search Edge Function

This Supabase Edge Function provides an API to search for stocks using the Financial Modeling Prep (FMP) API.

## Setup

1. Get an API key from [Financial Modeling Prep](https://site.financialmodelingprep.com/developer/docs)
2. Add your FMP API key to the Supabase secrets:

```bash
supabase secrets set FMP_API_KEY=your_fmp_api_key_here
```

## Development

You can develop and test the function locally:

```bash
supabase start
supabase functions serve search-stocks --env-file ./supabase/.env.local
```

Test the function with curl:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/search-stocks' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"query":"AAPL"}'
```

## Deployment

Deploy the function to your Supabase project:

```bash
supabase functions deploy search-stocks
```

Remember to set the environment variable in your deployed environment:

```bash
supabase secrets set FMP_API_KEY=your_fmp_api_key_here
```

## Usage

From your frontend, call the function:

```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/search-stocks`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`,
  },
  body: JSON.stringify({ query: 'AAPL' }),
});

const stockSuggestions = await response.json();
```

The response will contain an array of stock suggestions in the format:

```json
[
  {
    "symbol": "AAPL",
    "name": "Apple Inc",
    "exchange": "NASDAQ"
  },
  // ...more results
]
``` 
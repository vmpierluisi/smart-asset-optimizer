# Historical Prices Edge Function

This Supabase Edge Function provides an API to fetch historical adjusted closing prices for stocks using the Financial Modeling Prep (FMP) API.

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
supabase functions serve historical-prices --env-file ./supabase/.env.local
```

Test the function with curl:

```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/historical-prices' \
  --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "symbol": "AAPL",
    "startDate": "2023-01-01",
    "endDate": "2023-12-31"
  }'
```

## Deployment

Deploy the function to your Supabase project:

```bash
supabase functions deploy historical-prices
```

Remember to set the environment variable in your deployed environment:

```bash
supabase secrets set FMP_API_KEY=your_fmp_api_key_here
```

## Usage

From your frontend, call the function:

```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/historical-prices`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`,
  },
  body: JSON.stringify({
    symbol: 'AAPL',
    startDate: '2023-01-01',
    endDate: '2023-12-31'
  }),
});

const priceData = await response.json();
```

The response will contain an array of price data in the format:

```json
[
  {
    "date": "2023-01-03T00:00:00.000Z",
    "close": 124.25
  },
  {
    "date": "2023-01-04T00:00:00.000Z",
    "close": 126.36
  },
  // ...more data
]
``` 
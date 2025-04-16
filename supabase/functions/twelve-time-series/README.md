# Twelve Data Time Series Edge Function

This Supabase Edge Function provides historical time series data for stocks using the [Twelve Data API](https://twelvedata.com/docs#time-series).

## Description

This function fetches historical price data for a given stock symbol with the following features:
- Daily interval data (1day)
- 2 decimal places precision
- Adjusted for splits, dividends, etc.
- Configurable time period (day, week, month, year, YTD, max)

## API Parameters

The function accepts a POST request with the following JSON payload:

```json
{
  "symbol": "AAPL",
  "period": "1month"
}
```

| Parameter | Type   | Required | Description                                               |
|-----------|--------|----------|-----------------------------------------------------------|
| symbol    | string | Yes      | The stock symbol (e.g., AAPL, MSFT, GOOGL)                |
| period    | string | No       | Time period for data (1day, 1week, 1month, 1year, ytd, max). Default: 1month |

## Response Format

The function returns data in the following format:

```json
{
  "symbol": "AAPL",
  "data": [
    {
      "date": "2023-07-01",
      "open": 193.25,
      "high": 194.75,
      "low": 192.55,
      "close": 193.97,
      "volume": 20123456
    },
    // More price data points...
  ],
  "meta": {
    "symbol": "AAPL",
    "interval": "1day",
    "currency": "USD",
    "exchange_timezone": "America/New_York",
    "exchange": "NASDAQ",
    "mic_code": "XNAS",
    "type": "Common Stock"
  }
}
```

## Error Responses

The function returns appropriate error responses with status codes:

- 400: Invalid request (missing symbol, invalid parameters)
- 401: API key error
- 500: Server error or API failure

## Environment Variables

This function requires the following environment variable:

- `TWELVE_DATA_API_KEY`: Your Twelve Data API key

## Local Development

To run this function locally:

```bash
supabase functions serve twelve-time-series --env-file supabase/.env
``` 
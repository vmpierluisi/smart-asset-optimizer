# Analyst Ratings Edge Function

This Edge Function provides analyst ratings and price target data for a given stock symbol using the Financial Modeling Prep (FMP) API.

## Functionality

This function retrieves:
- Analyst consensus ratings (Strong Buy, Buy, Hold, Sell, Strong Sell)
- Average price target for the stock

## Usage

Send a POST request to the function with a JSON body containing a stock symbol:

```json
{
  "symbol": "AAPL"
}
```

## Response Format

```json
{
  "symbol": "AAPL",
  "analystRatings": {
    "strongBuy": 18,
    "buy": 7,
    "hold": 6,
    "sell": 0,
    "strongSell": 0,
    "consensus": "Strong Buy"
  },
  "averagePriceTarget": 219.56
}
```

If no data is available, `analystRatings` and/or `averagePriceTarget` will be null.

## Requirements

This function requires a valid Financial Modeling Prep (FMP) API key set as the environment variable `FMP_API_KEY`. 
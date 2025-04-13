# News Sentiment Edge Function

This Edge Function provides news sentiment data for a given stock symbol using the Alpha Vantage API.

## Functionality

This function retrieves:
- Recent news articles related to the stock symbol (up to 3 articles)
- Sentiment analysis for each news article
- Average sentiment score for the news articles

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
  "recentNews": [
    {
      "title": "Apple Reports Strong Quarterly Earnings",
      "sentiment": "Bullish",
      "sentimentColor": "#22c55e",
      "source": "Financial Times",
      "date": "2023-10-26",
      "rawDate": "20231026T163045",
      "url": "https://www.example.com/article",
      "imageUrl": "https://www.example.com/image.jpg"
    },
    // Additional news items...
  ],
  "sentimentScore": 75.5
}
```

## Sentiment Labels

The sentiment labels from Alpha Vantage are:
- `Bullish` (green)
- `Somewhat-Bullish` (light green)
- `Neutral` (amber)
- `Somewhat-Bearish` (light red)
- `Bearish` (red)

## Requirements

This function requires a valid Alpha Vantage API key set as the environment variable `ALPHA_VANTAGE_API_KEY`. 
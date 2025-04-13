# FMP Data Service

This edge function serves as a consolidated service for fetching financial data from Financial Modeling Prep (FMP) API endpoints.

## Purpose

The service centralizes API calls to FMP, reducing duplication across multiple edge functions. It supports fetching data from multiple endpoints in a single request.

## Endpoints Supported

- `ratios-ttm`: Financial ratios (TTM)
- `key-metrics-ttm`: Key financial metrics (TTM)
- `profile`: Company profile information

## Usage

Send a POST request to the service with the following structure:

```json
{
  "symbol": "AAPL",
  "endpoints": ["ratios-ttm", "key-metrics-ttm"]
}
```

### Parameters

- `symbol` (required): Stock ticker symbol
- `endpoints` (optional): Array of endpoints to fetch data from. If not provided, all supported endpoints will be called.

### Response

The service returns a response with the following structure:

```json
{
  "status": "success",
  "data": {
    "ratios-ttm": { /* Data from ratios-ttm endpoint */ },
    "key-metrics-ttm": { /* Data from key-metrics-ttm endpoint */ }
  }
}
```

If an error occurs, the response will have the following structure:

```json
{
  "status": "error",
  "error": "Error message"
}
```

## Environment Variables

- `FMP_API_KEY`: API key for Financial Modeling Prep
- `SUPABASE_URL`: Supabase project URL (for internal service calls)
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for internal service calls

## Implementation Notes

- Uses the FMP stable endpoints for TTM data
- All API calls are made in parallel
- Each endpoint data is returned as a single object, not an array
- If an endpoint fails, its data will be null in the response 
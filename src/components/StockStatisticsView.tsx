import React from 'react';
import { useStockStatistics } from '@/hooks/useStockStatistics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RefreshCw } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '@/utils/formatters';

interface StockStatisticsViewProps {
  symbol: string;
}

const StockStatisticsView: React.FC<StockStatisticsViewProps> = ({ symbol }) => {
  const { data, loading, error, refetch } = useStockStatistics(symbol);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-3/4" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-1/2" /></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-1/3" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Skeleton key={j} className="h-10" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Error Loading Statistics</CardTitle>
          <CardDescription>{error || "Couldn't load statistics for this stock"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { meta, statistics } = data;
  const {
    valuations_metrics,
    financials,
    stock_statistics,
    stock_price_summary,
    dividends_and_splits
  } = statistics;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{meta.name} ({meta.symbol}) Statistics</CardTitle>
            <CardDescription>
              {meta.exchange} • {meta.currency} • Last Updated: {new Date().toLocaleString()}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Valuation Metrics */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Valuation Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Market Cap</p>
                <p className="font-medium">{formatCurrency(valuations_metrics.market_capitalization)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Enterprise Value</p>
                <p className="font-medium">{formatCurrency(valuations_metrics.enterprise_value)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Trailing P/E</p>
                <p className="font-medium">{formatNumber(valuations_metrics.trailing_pe)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Forward P/E</p>
                <p className="font-medium">{formatNumber(valuations_metrics.forward_pe)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">PEG Ratio</p>
                <p className="font-medium">{formatNumber(valuations_metrics.peg_ratio)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Price/Sales (TTM)</p>
                <p className="font-medium">{formatNumber(valuations_metrics.price_to_sales_ttm)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Highlights */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Financial Highlights</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Revenue (TTM)</p>
                <p className="font-medium">{formatCurrency(financials.income_statement.revenue_ttm)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">EBITDA</p>
                <p className="font-medium">{formatCurrency(financials.income_statement.ebitda)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">EPS (TTM)</p>
                <p className="font-medium">{formatNumber(financials.income_statement.diluted_eps_ttm)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Profit Margin</p>
                <p className="font-medium">{formatPercent(financials.profit_margin)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Operating Margin</p>
                <p className="font-medium">{formatPercent(financials.operating_margin)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">ROE (TTM)</p>
                <p className="font-medium">{formatPercent(financials.return_on_equity_ttm)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Stock Statistics */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Stock Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">52-Week Range</p>
                <p className="font-medium">{formatNumber(stock_price_summary.fifty_two_week_low)} - {formatNumber(stock_price_summary.fifty_two_week_high)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">52-Week Change</p>
                <p className={`font-medium ${stock_price_summary.fifty_two_week_change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercent(stock_price_summary.fifty_two_week_change)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Beta</p>
                <p className="font-medium">{formatNumber(stock_price_summary.beta)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg 90-Day Volume</p>
                <p className="font-medium">{formatNumber(stock_statistics.avg_90_volume)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Shares Outstanding</p>
                <p className="font-medium">{formatNumber(stock_statistics.shares_outstanding)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Float Shares</p>
                <p className="font-medium">{formatNumber(stock_statistics.float_shares)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Dividends */}
          <div>
            <h3 className="font-semibold text-lg mb-2">Dividends & Splits</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Dividend Yield</p>
                <p className="font-medium">{formatPercent(dividends_and_splits.forward_annual_dividend_yield)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Annual Dividend Rate</p>
                <p className="font-medium">{formatCurrency(dividends_and_splits.forward_annual_dividend_rate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Ex-Dividend Date</p>
                <p className="font-medium">{dividends_and_splits.ex_dividend_date || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Payout Ratio</p>
                <p className="font-medium">{formatPercent(dividends_and_splits.payout_ratio)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Split</p>
                <p className="font-medium">{dividends_and_splits.last_split_factor || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Last Split Date</p>
                <p className="font-medium">{dividends_and_splits.last_split_date || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StockStatisticsView; 
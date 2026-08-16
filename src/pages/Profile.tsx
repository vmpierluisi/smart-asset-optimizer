import { useState, useEffect } from "react";
import { fetchStockQuote, StockQuote } from "@/utils/fmpFinanceUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Define the structure for a watchlist item matching StockAnalysis
interface WatchlistItem {
  symbol: string;
  name: string;
}

// Structure for storing watchlist item details along with quote
interface WatchlistDetail extends WatchlistItem {
  quote: StockQuote | null; // Allow null if fetch fails or hasn't completed
  isLoading: boolean;
}

export default function Profile() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [watchlistDetails, setWatchlistDetails] = useState<WatchlistDetail[]>([]);

  // Load watchlist from localStorage and initialize details state
  useEffect(() => {
    const storedWatchlist = localStorage.getItem("stockWatchlist");
    let loadedWatchlist: WatchlistItem[] = [];
    if (storedWatchlist) {
      try {
        const parsedWatchlist = JSON.parse(storedWatchlist);
        if (Array.isArray(parsedWatchlist)) {
          loadedWatchlist = parsedWatchlist;
        } else {
          console.error("Stored watchlist is not an array:", parsedWatchlist);
          localStorage.removeItem("stockWatchlist");
        }
      } catch (error) {
        console.error("Error parsing watchlist from localStorage:", error);
        localStorage.removeItem("stockWatchlist");
      }
    }
    setWatchlist(loadedWatchlist);
    // Initialize details with loading state
    setWatchlistDetails(loadedWatchlist.map(item => ({ ...item, quote: null, isLoading: true })));
  }, []);

  // Fetch quote for each item in the watchlist
  useEffect(() => {
    if (watchlist.length === 0) return;

    const fetchWatchlistQuotes = async () => {
      const promises = watchlist.map(async (item) => {
        try {
          const quote = await fetchStockQuote(item.symbol);
          return { ...item, quote, isLoading: false };
        } catch (error) {
          console.error(`Error fetching quote for ${item.symbol}:`, error);
          // Keep item in list but mark as failed/not loaded
          return { ...item, quote: null, isLoading: false }; 
        }
      });
      
      const results = await Promise.all(promises);
      setWatchlistDetails(results);
    };

    fetchWatchlistQuotes();
  }, [watchlist]); // Re-fetch if the raw watchlist changes

  // Function to remove item from watchlist
  const removeFromWatchlist = (symbolToRemove: string) => {
    const updatedWatchlist = watchlist.filter(item => item.symbol !== symbolToRemove);
    setWatchlist(updatedWatchlist);
    setWatchlistDetails(watchlistDetails.filter(item => item.symbol !== symbolToRemove));
    localStorage.setItem("stockWatchlist", JSON.stringify(updatedWatchlist));
    toast({
      title: "Removed from Watchlist",
      description: `${symbolToRemove} removed.`,
    });
  };

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>

      {/* Watchlist Section */}
      <Card>
        <CardHeader>
          <CardTitle>My Watchlist</CardTitle>
        </CardHeader>
        <CardContent>
          {watchlistDetails.length === 0 ? (
            <p className="text-muted-foreground">
              Your watchlist is empty. Add stocks from the Stock Analysis page.
            </p>
          ) : (
            <div className="space-y-3">
              {watchlistDetails.map((item) => (
                <div 
                  key={item.symbol} 
                  className="flex items-center justify-between p-3 border rounded-md bg-card hover:bg-muted transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-muted-foreground">{item.symbol}</span>
                    </div>
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">{item.symbol}</div>
                    </div>
                  </div>

                  {item.isLoading ? (
                    <div className="flex items-center space-x-4">
                       <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  ) : item.quote ? (
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold">
                          ${item.quote.price?.toFixed(2) ?? 'N/A'}
                        </div>
                        <div 
                          className={`text-sm flex items-center justify-end ${item.quote.change > 0 ? 'text-green-600' : item.quote.change < 0 ? 'text-red-600' : 'text-muted-foreground'}`}
                        >
                          {item.quote.change > 0 ? (
                            <ArrowUp className="h-3 w-3 mr-0.5" />
                          ) : item.quote.change < 0 ? (
                            <ArrowDown className="h-3 w-3 mr-0.5" />
                          ) : null}
                          {item.quote.change?.toFixed(2) ?? '0.00'} ({item.quote.changePercent?.toFixed(2) ?? '0.00'}%)
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-red-500 h-8 w-8"
                        onClick={() => removeFromWatchlist(item.symbol)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                     <div className="flex items-center space-x-4">
                        <div className="text-right text-sm text-muted-foreground">Data unavailable</div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-red-500 h-8 w-8"
                          onClick={() => removeFromWatchlist(item.symbol)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                     </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Original placeholder content - kept for reference or future use */}
      {/* 
      <div className="mt-8 p-6 bg-card text-card-foreground rounded-lg border shadow-sm">
        <p className="text-muted-foreground">
          This is a blank profile page. All personal information has been moved to the Settings page.
        </p>
      </div> 
      */}
    </div>
  );
} 
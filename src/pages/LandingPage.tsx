import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const LandingPage = () => {
  return (
    <div className="w-full p-[30px]">
      <div className="w-full space-y-12">
        <section className="space-y-6 text-left">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Modern Portfolio Optimizer
          </h1>
          <p className="max-w-3xl text-xl text-muted-foreground">
            Optimize your investment portfolio using advanced mathematical models and modern portfolio theory
          </p>
          <div className="flex gap-4">
            <Button asChild size="lg">
              <Link to="/optimizer">Try Portfolio Optimizer</Link>
            </Button>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">1. Select Your Stocks</h3>
              <p>Choose the stocks you want to include in your portfolio. Add multiple stocks to diversify your investments.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold">2. Set Parameters</h3>
              <p>Define your risk tolerance, portfolio value, and select a benchmark index to compare your portfolio against.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold">3. Optimize</h3>
              <p>Our algorithm analyzes historical data and calculates the optimal allocation to maximize returns while minimizing risk.</p>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="text-3xl font-bold tracking-tight">Key Features</h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Modern Portfolio Theory</h3>
              <p>We use Nobel Prize-winning Modern Portfolio Theory to find the optimal balance between risk and return.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Benchmark Comparison</h3>
              <p>Compare your optimized portfolio against major indices like S&P 500, Dow Jones, Nasdaq, and more.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Risk Visualization</h3>
              <p>See clear visualizations of expected returns, volatility, and how your portfolio compares to benchmarks.</p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Customizable Parameters</h3>
              <p>Adjust your risk aversion level and see how it affects the optimal allocation of your investments.</p>
            </div>
          </div>
          <div className="flex pt-8">
            <Button asChild size="lg">
              <Link to="/optimizer">Get Started Now</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;

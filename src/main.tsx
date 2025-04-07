import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import LandingPage from './pages/LandingPage'
import { PortfolioOptimizer } from './components/PortfolioOptimizer'
import MarketNews from './pages/MarketNews'
import StockAnalysis from './pages/StockAnalysis'
import NotFound from './pages/NotFound'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route index element={<LandingPage />} />
        <Route path="optimizer" element={<PortfolioOptimizer />} />
        <Route path="market-news" element={<MarketNews />} />
        <Route path="stock-analysis" element={<StockAnalysis />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  </BrowserRouter>
)

import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import LandingPage from './pages/LandingPage'
import { PortfolioOptimizer } from './components/PortfolioOptimizer'
import MarketNews from './pages/MarketNews'
import StockAnalysis from './pages/StockAnalysis'
import NotFound from './pages/NotFound'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import { AuthProvider } from './lib/auth'
import { ProtectedRoute } from './components/ProtectedRoute'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<LandingPage />} />
          <Route path="optimizer" element={
            <ProtectedRoute>
              <PortfolioOptimizer />
            </ProtectedRoute>
          } />
          <Route path="market-news" element={
            <ProtectedRoute>
              <MarketNews />
            </ProtectedRoute>
          } />
          <Route path="stock-analysis" element={
            <ProtectedRoute>
              <StockAnalysis />
            </ProtectedRoute>
          } />
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>
)

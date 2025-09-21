import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch, Route, useLocation, Link } from "wouter";
import { Loader2 } from "lucide-react";
import HomePage from "@/pages/home-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, AdminProtectedRoute } from "@/lib/protected-route";
import { CurrencyProvider } from "@/providers/CurrencyProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { DebugProvider } from "@/providers/DebugProvider";

// Import all pages
import LeaderboardPage from "@/pages/leaderboard-page";
import ChatPage from "@/pages/chat-page";
import CurrencyPage from "@/pages/global-currency";
import ProfilePage from "@/pages/profile-page";
import WalletPage from "@/pages/wallet-page";
import TransactionHistoryPage from "@/pages/transaction-history-page";
import AdminPage from "@/pages/admin-page";
import AdminAuditPage from "@/pages/AdminAuditPage";
import NewAuthPage from "@/pages/new-auth-page";
import GamesPage from "@/pages/games-page";
import DicePage from "@/pages/dice-page";
import SlotsPage from "@/pages/slots-page";
import PlinkoMasterPage from "@/pages/plinko-master-page";
import SettingsPage from "@/pages/settings-page";
import MinesPage from "@/pages/mines-page";
import HtmlGamePage from "@/pages/html-game-page";
import DynamicGameLoader from "@/components/games/DynamicGameLoader";
import DepositWithdrawalPage from "@/pages/deposit-withdrawal-page";
import { ReferralPage } from "@/pages/referral-page";
import { NotificationBanner } from "@/components/ui/notification-banner";
import Landing from "@/pages/Landing";
import ThemesPage from "@/pages/themes";
import PinDemoPage from "@/pages/pin-demo";
import { AutoRedirect } from "@/components/AutoRedirect";
import { AdBlockBypass } from "@/components/AdBlockBypass";
import { DebugPerformanceIndicator } from "@/components/debug/DebugUtils";






// Main App component with routing
export default function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  // Short initial loading effect and set initial theme
  useEffect(() => {
    // Initialize theme immediately to prevent flash of unstyled content
    const savedTheme = localStorage.getItem('shadow-casino-theme') || 'mystic-twilight';
    const themeClass = `theme-${savedTheme.split('-')[0] === 'mystic' ? 'mystic-twilight' : savedTheme}`;
    document.body.classList.add(themeClass);

    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background" data-testid="loading-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" data-testid="loading-spinner" />
      </div>
    );
  }

  // REMOVED: The conditional hook usage was causing React hook order violations

  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <DebugProvider>
            <WebSocketProvider>
              <CurrencyProvider>
                <AutoRedirect />
                <AdBlockBypass />
                <TooltipProvider>
                <Toaster />
                <NotificationBanner />
              <Switch>
                {/* Public routes */}
                <Route path="/auth" component={NewAuthPage} />
                {/* Casino Dashboard - Main page after login */}
                <ProtectedRoute path="/" component={HomePage} />

                {/* Game Routes */}
                <ProtectedRoute path="/slots" component={SlotsPage} />
                <ProtectedRoute path="/dice" component={DicePage} />
                <ProtectedRoute path="/mines" component={MinesPage} />
                <ProtectedRoute path="/plinko_master" component={PlinkoMasterPage} />
                <ProtectedRoute path="/games" component={GamesPage} />

                {/* Casino Features */}
                <ProtectedRoute path="/settings" component={SettingsPage} />
                <ProtectedRoute path="/leaderboard" component={LeaderboardPage} />
                <ProtectedRoute path="/chat" component={ChatPage} />
                <ProtectedRoute path="/currency" component={CurrencyPage} />
                <ProtectedRoute path="/themes" component={ThemesPage} />
                <ProtectedRoute path="/pin-demo" component={PinDemoPage} />
                <ProtectedRoute path="/account/profile" component={ProfilePage} />
                <ProtectedRoute path="/account/wallet" component={WalletPage} />
                <ProtectedRoute path="/account/history" component={TransactionHistoryPage} />
                <ProtectedRoute path="/account/referrals" component={ReferralPage} />
                <ProtectedRoute path="/deposit-withdrawal" component={DepositWithdrawalPage} />

                {/* Admin Panel - Only accessible by authorized admins */}
                <AdminProtectedRoute path="/admin" component={AdminPage} />
                <AdminProtectedRoute path="/admin/audit" component={AdminAuditPage} />
                <ProtectedRoute path="/html-game/:id" component={HtmlGamePage} />
                <ProtectedRoute path="/game/:id" component={DynamicGameLoader} />

                {/* 404 Not Found page */}
                <Route>
                  <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4" data-testid="not-found-page">
                    <h1 className="text-3xl font-bold mb-4" data-testid="text-error-title">Page Not Found</h1>
                    <p className="text-gray-400 mb-6" data-testid="text-error-message">The page you're looking for doesn't exist.</p>
                    <Link href="/" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90" data-testid="button-return-home">
                      Return to Home
                    </Link>
                  </div>
                </Route>
              </Switch>
              </TooltipProvider>
              <DebugPerformanceIndicator />
              </CurrencyProvider>
            </WebSocketProvider>
          </DebugProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
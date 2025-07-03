import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Switch, Route, useLocation, Link, Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import HomePage from "@/pages/home-page";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute, AdminProtectedRoute } from "@/lib/protected-route";
import { CurrencyProvider } from "@/providers/CurrencyProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { FlexibleBetInput } from "@/components/ui/flexible-bet-input";
import { useSimpleBalance } from "@/hooks/use-simple-balance";
import { useCurrency } from "@/hooks/use-currency";
import { CurrencyDisplay, CurrencySymbol } from "@/components/ui/currency-display";
import { Currency } from "@shared/schema";
import { PlinkoMasterGame } from "@/components/games/PlinkoMasterGame";
import { CurrencySelector } from "@/components/common/CurrencySelector";
import { WinnersList } from "@/components/common/WinnersList";
import { motion } from "framer-motion";

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
import HtmlGamePage from "@/pages/html-game-page";
import DepositWithdrawalPage from "@/pages/deposit-withdrawal-page";
import { ReferralPage } from "@/pages/referral-page";
import { NotificationBanner } from "@/components/ui/notification-banner";
import Landing from "@/pages/Landing";
import ThemesPage from "@/pages/themes";

// Auth component
function AuthPage() {
  const [formType, setFormType] = useState<"login" | "register">("login");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login, register, isLoading, error, user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    phone: ""
  });

  // Set error messages from auth context
  useEffect(() => {
    if (error) {
      setErrorMessage(error);
    }
  }, [error]);

  // Handle login form submission
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await login(loginData);
    } catch (error) {
      // Error handling is done in auth context
    }
  };

  // Handle register form submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      await register(registerData);
    } catch (error) {
      // Error handling is done in auth context
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Form Section */}
      <div className="w-full md:w-1/2 p-8 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {formType === "login" ? "Log In" : "Create Account"}
            </h2>

            {formType === "login" ? (
              <form onSubmit={handleLogin}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <input 
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <input 
                      type="password"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Log In"}
                  </button>
                  {errorMessage && (
                    <p className="text-red-500 text-sm text-center">
                      {errorMessage}
                    </p>
                  )}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm">
                    Don't have an account?{" "}
                    <button 
                      type="button"
                      onClick={() => setFormType("register")}
                      className="text-primary hover:underline"
                    >
                      Register now
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Username</label>
                    <input 
                      type="text"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Choose a username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input 
                      type="email"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Enter your email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Password</label>
                    <input 
                      type="password"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Create a password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <input 
                      type="tel"
                      className="w-full p-2 border rounded-md text-black"
                      placeholder="Enter your phone number"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-2 rounded-md hover:bg-primary/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </button>
                  {errorMessage && (
                    <p className="text-red-500 text-sm text-center">
                      {errorMessage}
                    </p>
                  )}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm">
                    Already have an account?{" "}
                    <button 
                      type="button"
                      onClick={() => setFormType("login")}
                      className="text-primary hover:underline"
                    >
                      Log in
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="w-full md:w-1/2 bg-background-darker p-8 flex items-center justify-center">
        <div className="text-center max-w-lg">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Project Shadow <span className="text-primary">Casino</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Experience the thrill of our exclusive casino games. Play and win with our cutting-edge gaming platform.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-background p-4 rounded-lg text-center">
              <div className="text-3xl mb-2">🎰</div>
              <h3 className="text-white font-medium">Slots</h3>
            </div>
            <div className="bg-background p-4 rounded-lg text-center">
              <div className="text-3xl mb-2">🎲</div>
              <h3 className="text-white font-medium">Dice</h3>
            </div>
            <div className="bg-background p-4 rounded-lg text-center">
              <div className="text-3xl mb-2">📍</div>
              <h3 className="text-white font-medium">Plinko</h3>
            </div>
          </div>
          <div className="p-4 bg-background rounded-lg">
            <p className="text-gray-400 text-sm">
              Join thousands of players already winning on Project Shadow Casino. Register now and claim your welcome bonus!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Slots game component
function SlotsGamePage() {
  const { user } = useAuth();
  const { currency, getCurrencySymbol } = useCurrency();

  const [betAmount, setBetAmount] = useState<number>(10);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Format money values
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Handle spin button click with actual API call
  const handleSpin = async () => {
    try {
      setError(null);
      setIsSpinning(true);

      const response = await fetch('/api/games/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameType: 'slots',
          betAmount,
          currency: user?.currency || 'USD'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to play the game');
      }

      const result = await response.json();
      setGameResult(result);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Game error:', err);
    } finally {
      setIsSpinning(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Slots Game</h1>

        <div className="bg-card rounded-lg p-8">
          <div className="max-w-2xl mx-auto">
            {/* Display reels */}
            <div className="bg-background-darker rounded-lg p-6 mb-6">
              <div className="relative">
                {/* Win line display */}
                {gameResult?.isWin && (
                  <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 animate-pulse z-10"></div>
                )}

                <div className="grid grid-cols-5 gap-3 relative">
                  {gameResult?.gameData?.reels ? (
                    gameResult.gameData.reels.map((symbol: string, index: number) => (
                      <div 
                        key={index} 
                        className={`h-24 flex items-center justify-center text-4xl bg-background rounded-md border-2 overflow-hidden
                          ${gameResult.isWin && index > 0 && index < 4 
                            ? 'border-green-500 animate-pulse' 
                            : 'border-border'
                          }`}
                      >
                        <div className={isSpinning ? 'animate-slot-spin' : 'animate-fadeIn'}>
                          {symbol}
                        </div>

                        {/* Highlight effect for winning symbols */}
                        {gameResult.isWin && index > 0 && index < 4 && (
                          <div className="absolute inset-0 bg-green-500/10 animate-shimmer rounded-md"></div>
                        )}
                      </div>
                    ))
                  ) : (
                    Array(5).fill(0).map((_, index) => (
                      <div 
                        key={index}
                        className="h-24 flex items-center justify-center text-4xl bg-background rounded-md border-2 border-border"
                      >
                        {isSpinning ? (
                          <div className="animate-spin">🎰</div>
                        ) : (
                          "?"
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Game controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bet controls */}
              <div className="bg-background rounded-lg p-4">
                <FlexibleBetInput
                  value={betAmount}
                  onChange={setBetAmount}
                  disabled={isSpinning}
                  currency={user?.currency as Currency || Currency.USD}
                  balance={parseFloat(user?.balance || '0')}
                  minBet={1}
                />
              </div>

              {/* Spin button */}
              <div className="bg-background rounded-lg p-4 flex flex-col items-center justify-center">
                <button 
                  className={`w-full h-full bg-primary rounded-lg flex flex-col items-center justify-center text-white font-bold ${
                    isSpinning ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'
                  }`}
                  onClick={handleSpin}
                  disabled={isSpinning}
                >
                  {isSpinning ? (
                    <>
                      <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mb-2"></div>
                      <span>Spinning...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl mb-1">🎰</span>
                      <span>SPIN</span>
                    </>
                  )}
                </button>
              </div>

              {/* Result display */}
              <div className="bg-background rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Result</h3>
                {error ? (
                  <div className="text-red-500 p-2 bg-background-darker rounded-md">{error}</div>
                ) : gameResult ? (
                  <div className={`p-3 rounded-md ${gameResult.isWin ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <div className="text-center font-bold text-xl mb-1">
                      {gameResult.isWin ? 'YOU WON!' : 'YOU LOST'}
                    </div>
                    {gameResult.isWin && (
                      <div className="text-center">
                        <span className="text-green-400 font-medium">
                          {getCurrencySymbol(user?.currency || 'USD')}{formatMoney(gameResult.winAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center p-2">
                    Place your bet and hit SPIN!
                  </div>
                )}
              </div>
            </div>

            {/* Game rules */}
            <div className="mt-6 p-4 bg-background-darker rounded-lg">
              <h3 className="font-medium mb-2">How to Play:</h3>
              <ul className="list-disc list-inside text-sm text-gray-400">
                <li>Set your bet amount using the controls</li>
                <li>Hit the SPIN button to play</li>
                <li>Match 3 symbols in the middle to win</li>
                <li>Different symbols have different payouts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Dice game component
function DiceGamePage() {
  const { user } = useAuth();
  const { currency, getCurrencySymbol } = useCurrency();
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [dice, setDice] = useState<number[]>([1, 2, 3, 4, 5]);

  // Format money values
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get dice emoji for each number
  const getDiceEmoji = (number: number) => {
    switch(number) {
      case 1: return "⚀";
      case 2: return "⚁";
      case 3: return "⚂";
      case 4: return "⚃";
      case 5: return "⚄";
      case 6: return "⚅";
      default: return "🎲";
    }
  };

  // Handle roll button click with actual API call
  const handleRoll = async () => {
    try {
      setError(null);
      setIsRolling(true);

      const response = await fetch('/api/games/play', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameType: 'dice',
          betAmount,
          currency: user?.currency || 'USD'
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to play the game');
      }

      const result = await response.json();
      setGameResult(result);

      // Update dice display based on game result
      if (result.gameData && result.gameData.dice) {
        setDice(result.gameData.dice);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Game error:', err);
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dice Game</h1>

        <div className="bg-card rounded-lg p-8">
          <div className="max-w-2xl mx-auto">
            {/* Dice display - slots style */}
            <div className="bg-background-darker rounded-lg p-6 mb-6">
              <div className="relative">
                {/* Win line display */}
                {gameResult?.isWin && (
                  <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 animate-pulse z-10"></div>
                )}

                <div className="grid grid-cols-5 gap-3 relative">
                  {dice.map((diceValue, index) => (
                    <div 
                      key={index} 
                      className={`h-24 flex items-center justify-center text-4xl bg-background rounded-md border-2 overflow-hidden
                        ${gameResult?.isWin && index >= 1 && index <= 3 
                          ? 'border-green-500 animate-pulse' 
                          : 'border-border'
                        }`}
                    >
                      <div className={isRolling ? 'animate-slot-spin' : 'animate-fadeIn'}>
                        {isRolling ? "🎲" : getDiceEmoji(diceValue)}
                      </div>

                      {/* Highlight effect for winning dice */}
                      {gameResult?.isWin && index >= 1 && index <= 3 && (
                        <div className="absolute inset-0 bg-green-500/10 animate-shimmer rounded-md"></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Game controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bet controls */}
              <div className="bg-background rounded-lg p-4">
                <FlexibleBetInput
                  value={betAmount}
                  onChange={setBetAmount}
                  disabled={isRolling}
                  currency={user?.currency as Currency || Currency.USD}
                  balance={parseFloat(user?.balance || '0')}
                  minBet={1}
                />
              </div>

              {/* Roll button */}
              <div className="bg-background rounded-lg p-4 flex flex-col items-center justify-center">
                <button 
                  className={`w-full h-full bg-primary rounded-lg flex flex-col items-center justify-center text-white font-bold ${
                    isRolling ? 'opacity-70 cursor-not-allowed' : 'hover:bg-primary/90'
                  }`}
                  onClick={handleRoll}
                  disabled={isRolling}
                >
                  {isRolling ? (
                    <>
                      <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mb-2"></div>
                      <span>Rolling...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl mb-1">🎲</span>
                      <span>ROLL</span>
                    </>
                  )}
                </button>
              </div>

              {/* Result display */}
              <div className="bg-background rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Result</h3>
                {error ? (
                  <div className="text-red-500 p-2 bg-background-darker rounded-md">{error}</div>
                ) : gameResult ? (
                  <div className={`p-3 rounded-md ${gameResult.isWin ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                    <div className="text-center font-bold text-xl mb-1">
                      {gameResult.isWin ? 'YOU WON!' : 'YOU LOST'}
                    </div>
                    {gameResult.isWin && (
                      <div className="text-center">
                        <span className="text-green-400 font-medium">
                          {getCurrencySymbol(user?.currency || 'USD')}{formatMoney(gameResult.winAmount)}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center p-2">
                    Place your bet and hit ROLL!
                  </div>
                )}
              </div>
            </div>

            {/* Game rules */}
            <div className="mt-6 p-4 bg-background-darker rounded-lg">
              <h3 className="font-medium mb-2">How to Play:</h3>
              <ul className="list-disc list-inside text-sm text-gray-400">
                <li>Set your bet amount using the controls</li>
                <li>Hit the ROLL button to play</li>
                <li>Match 3 dice in the middle positions to win</li>
                <li>Different combinations have different payouts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// Plinko Master game page component
function PlinkoMasterGamePage() {
  return (
    <MainLayout>
      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl lg:text-2xl font-bold font-heading">Plinko</h2>
          </div>
          <PlinkoMasterGame />
        </motion.div>
      </div>

      <div className="px-4 lg:px-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-xl lg:text-2xl font-bold font-heading mb-4">How to Play</h2>
          <div className="bg-background-light rounded-xl p-6">
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Set your bet amount using the controls on the left.</li>
              <li>Click the "DROP BALL" button to release the ball.</li>
              <li>Watch as the ball bounces through the pins and lands in a slot.</li>
              <li>Each slot has a different multiplier - higher multipliers are rarer!</li>
              <li>Your winnings are calculated by multiplying your bet by the slot multiplier.</li>
              <li>Click on any slot to see its probability percentage.</li>
            </ol>
            <div className="mt-4 p-4 bg-background-darker rounded-lg">
              <p className="text-sm text-accent-gold font-semibold">Strategy tip:</p>
              <p className="text-sm text-gray-400 mt-1">
                The ball has a higher chance of landing in center slots due to physics simulation.
                Edge slots with 2.0x multipliers are rare but offer the highest payouts!
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <WinnersList />
        </motion.div>
      </div>
    </MainLayout>
  );
}

// Settings page component
function SettingsPage() {
  const { user } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState<string>(user?.currency || 'USD');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Available currencies
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'BTC', name: 'Bitcoin', symbol: '₿' }
  ];

  // Handle currency change
  const handleCurrencyChange = async () => {
    if (selectedCurrency === user?.currency) {
      setError('You are already using this currency.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/wallet/change-currency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currency: selectedCurrency }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change currency.');
      }

      // Success
      setSuccess(`Currency successfully changed to ${selectedCurrency}.`);

      // Force a reload to update the UI with new currency
      window.location.reload();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Currency change error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="bg-card rounded-lg p-8 max-w-3xl mx-auto">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Currency Settings</h2>
              <p className="text-gray-400 mb-4">
                Choose your preferred currency for deposits, withdrawals, and gameplay.
              </p>

              <div className="bg-background p-4 rounded-lg">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Select Currency</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currencies.map((currency) => (
                      <div 
                        key={currency.code}
                        className={`p-3 border-2 rounded-lg cursor-pointer flex items-center ${
                          selectedCurrency === currency.code 
                            ? 'border-primary bg-primary/10' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedCurrency(currency.code)}
                      >
                        <div className="w-10 h-10 bg-background-darker rounded-full flex items-center justify-center text-xl mr-3">
                          {currency.symbol}
                        </div>
                        <div>
                          <div className="font-medium">{currency.name}</div>
                          <div className="text-xs text-gray-400">{currency.code}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 flex items-center"
                    onClick={handleCurrencyChange}
                    disabled={isLoading || selectedCurrency === user?.currency}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>

                {error && (
                  <div className="mt-3 p-2 bg-red-500/20 text-red-400 rounded-md text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mt-3 p-2 bg-green-500/20 text-green-400 rounded-md text-sm">
                    {success}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Theme Settings</h2>
              <p className="text-gray-400 mb-4">
                Theme options are available from the sidebar. Click on the theme icon at the bottom of the sidebar to change your visual theme.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <div className="bg-background p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Username</div>
                    <div className="font-medium">{user?.username}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Email</div>
                    <div className="font-medium">{user?.email}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Account Type</div>
                    <div className="font-medium capitalize">{user?.role || 'User'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Account Status</div>
                    <div className="font-medium">
                      {user?.isBanned ? (
                        <span className="text-red-500">Banned</span>
                      ) : (
                        <span className="text-green-500">Active</span>
                      )}
                      {user?.isMuted && (
                        <span className="ml-2 text-yellow-500">(Muted)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  // REMOVED: The conditional hook usage was causing React hook order violations

  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <WebSocketProvider>
            <CurrencyProvider>
              <TooltipProvider>
              <Toaster />
              <NotificationBanner />
              <Switch>
                {/* Public routes */}
                <Route path="/auth" component={NewAuthPage} />
                {/* Casino Dashboard - Main page after login */}
                <ProtectedRoute path="/" component={HomePage} />

                {/* Game Routes */}
                <ProtectedRoute path="/slots" component={SlotsGamePage} />
                <ProtectedRoute path="/dice" component={DiceGamePage} />
                <ProtectedRoute path="/plinko_master" component={PlinkoMasterGamePage} />
                <ProtectedRoute path="/games" component={GamesPage} />

                {/* Casino Features */}
                <ProtectedRoute path="/settings" component={SettingsPage} />
                <ProtectedRoute path="/leaderboard" component={LeaderboardPage} />
                <ProtectedRoute path="/chat" component={ChatPage} />
                <ProtectedRoute path="/currency" component={CurrencyPage} />
                <ProtectedRoute path="/themes" component={ThemesPage} />
                <ProtectedRoute path="/account/profile" component={ProfilePage} />
                <ProtectedRoute path="/account/wallet" component={WalletPage} />
                <ProtectedRoute path="/account/history" component={TransactionHistoryPage} />
                <ProtectedRoute path="/account/referrals" component={ReferralPage} />
                <ProtectedRoute path="/deposit-withdrawal" component={DepositWithdrawalPage} />

                {/* Admin Panel - Only accessible by authorized admins */}
                <AdminProtectedRoute path="/admin" component={AdminPage} />
                <AdminProtectedRoute path="/admin/audit" component={AdminAuditPage} />
                <ProtectedRoute path="/html-game/:id" component={HtmlGamePage} />

                {/* 404 Not Found page */}
                <Route>
                  <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
                    <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
                    <p className="text-gray-400 mb-6">The page you're looking for doesn't exist.</p>
                    <Link href="/" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
                      Return to Home
                    </Link>
                  </div>
                </Route>
              </Switch>
              </TooltipProvider>
            </CurrencyProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
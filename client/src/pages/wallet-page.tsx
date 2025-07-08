import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, 
  AlertCircle, Copy, ArrowRight, DollarSign, 
  Check, Info, Clock, RefreshCw 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/game-utils";


export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [balance, setBalance] = useState<string>(user?.balance || "0");
  const [currency, setCurrency] = useState<string>(user?.currency || "USD");
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{ method: string; whatsappNumber: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch wallet balance
    async function fetchBalance() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/wallet/balance');
        if (!response.ok) {
          throw new Error('Failed to fetch balance');
        }
        const data = await response.json();
        setBalance(data.balance);
        setCurrency(data.currency);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }
    
    // Fetch payment info
    async function fetchPaymentInfo() {
      try {
        const response = await fetch('/api/wallet/payment-info');
        if (!response.ok) {
          throw new Error('Failed to fetch payment info');
        }
        const data = await response.json();
        setPaymentInfo(data);
      } catch (error) {
        console.error(error);
      }
    }
    
    fetchBalance();
    fetchPaymentInfo();
  }, []);

  const getCurrencySymbol = (curr: string) => {
    const symbols: { [key: string]: string } = {
      'USD': '$',
      'BDT': '৳',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'INR': '₹',
      'BTC': '₿',
      'ETH': 'Ξ'
    };
    return symbols[curr] || curr;
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      toast({
        title: "Copied!",
        description: "Payment details copied to clipboard",
      });
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the details manually",
        variant: "destructive",
      });
    }
  };

  const refreshBalance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/wallet/balance');
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      const data = await response.json();
      setBalance(data.balance);
      setCurrency(data.currency);
      toast({
        title: "Balance Updated",
        description: "Your wallet balance has been refreshed",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to refresh balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-background-darker overflow-x-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 w-full">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="bg-primary/10 p-2 sm:p-3 rounded-full">
                  <Wallet className="h-6 sm:h-8 w-6 sm:w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Your Wallet</h1>
              <p className="text-gray-400 text-sm sm:text-base">Manage your funds with 80+ payment methods</p>
            </div>

            {/* Main Wallet Card */}
            <div className="bg-card rounded-lg shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold">Account Balance</h2>
                <button
                  onClick={refreshBalance}
                  disabled={isLoading}
                  className="flex items-center p-2 text-gray-400 hover:text-primary transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
              
              <div className="text-center py-4 sm:py-8">
                <div className="bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-5 sm:h-6 w-5 sm:w-6 text-primary mr-2" />
                    <span className="text-xs sm:text-sm font-medium text-gray-400">Available Balance</span>
                  </div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1">
                    <span className="text-xl sm:text-2xl lg:text-3xl">{getCurrencySymbol(currency)}</span>
                    <span className="ml-1">
                      {isLoading ? (
                        <div className="inline-block animate-pulse bg-gray-300 rounded h-6 sm:h-8 w-24 sm:w-32"></div>
                      ) : (
                        formatAmount(balance)
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button
                    onClick={() => setLocation('/deposit-withdrawal')}
                    className="flex items-center justify-center p-4 bg-green-600/10 text-green-500 rounded-lg hover:bg-green-600/20 transition-colors"
                  >
                    <ArrowDownLeft className="h-5 w-5 mr-2" />
                    Deposit Funds
                    <div className="ml-auto text-xs bg-green-500/20 px-2 py-1 rounded">
                      80+ Methods
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setLocation('/deposit-withdrawal')}
                    className="flex items-center justify-center p-4 bg-amber-600/10 text-amber-500 rounded-lg hover:bg-amber-600/20 transition-colors"
                  >
                    <ArrowUpRight className="h-5 w-5 mr-2" />
                    Withdraw Funds
                    <div className="ml-auto text-xs bg-amber-500/20 px-2 py-1 rounded">
                      80+ Methods
                    </div>
                  </button>
                </div>
                
                {error && (
                  <div className="mt-4 p-3 bg-red-500/20 text-red-400 rounded-md flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods Info */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-6 mb-6 border border-primary/20">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-primary mb-2">80+ Payment Methods Available</h3>
                <p className="text-muted-foreground">International, National & Local payment options for your convenience</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="bg-blue-500/10 p-2 rounded-lg mr-3">
                      <ArrowDownLeft className="h-4 w-4 text-blue-500" />
                    </div>
                    <h4 className="font-semibold">International</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">PayPal, Stripe, Skrill, Wise, Revolut, Google Pay, Apple Pay, and more</p>
                </div>
                
                <div className="bg-card rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="bg-green-500/10 p-2 rounded-lg mr-3">
                      <DollarSign className="h-4 w-4 text-green-500" />
                    </div>
                    <h4 className="font-semibold">National Banking</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">All major banks, internet banking, and card payments (VISA, Mastercard, Amex)</p>
                </div>
                
                <div className="bg-card rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="bg-purple-500/10 p-2 rounded-lg mr-3">
                      <ArrowUpRight className="h-4 w-4 text-purple-500" />
                    </div>
                    <h4 className="font-semibold">Local Mobile</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">bKash, Nagad, Rocket, Upay, SureCash, and all agent banking services</p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-card rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Wallet Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-lg mr-3 mt-1">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Instant Deposits</h4>
                    <p className="text-sm text-gray-400">Add funds instantly with mobile banking and cards</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-lg mr-3 mt-1">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Fast Withdrawals</h4>
                    <p className="text-sm text-gray-400">Withdraw your winnings within 24 hours</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-lg mr-3 mt-1">
                    <Info className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Low Fees</h4>
                    <p className="text-sm text-gray-400">Competitive transaction fees starting from 1.0%</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-primary/10 p-2 rounded-lg mr-3 mt-1">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Multi-Currency</h4>
                    <p className="text-sm text-gray-400">Support for BDT, USD, EUR, and other major currencies</p>
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
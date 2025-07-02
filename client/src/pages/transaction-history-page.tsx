import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ClipboardList, Calendar, ArrowUpRight, ArrowDownLeft, RefreshCw, AlertCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define TransactionType enum
enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  BET = "bet",
  WIN = "win"
}

interface Transaction {
  id: number;
  userId: number;
  amount: string;
  currency: string;
  type: TransactionType;
  status: string;
  createdAt: string;
  metadata?: any;
}

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  const fetchTransactions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/wallet/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to load transactions',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-amber-500" />;
      case "bet":
        return <span className="text-xs font-semibold p-1 bg-red-500/20 text-red-400 rounded">BET</span>;
      case "win":
        return <span className="text-xs font-semibold p-1 bg-green-500/20 text-green-400 rounded">WIN</span>;
      default:
        return null;
    }
  };
  
  const getTransactionStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full">Completed</span>;
      case "pending":
        return <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full">Pending</span>;
      case "failed":
        return <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-500 rounded-full">Failed</span>;
      default:
        return <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full">{status}</span>;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };
  
  const getGameDetails = (transaction: Transaction) => {
    // If no metadata, return empty
    if (!transaction.metadata || !transaction.metadata.gameType) {
      return <span className="text-gray-500">-</span>;
    }
    
    const metadata = transaction.metadata;
    const gameType = metadata.gameType;
    
    // Get game icon based on type
    const getGameIcon = (type: string) => {
      switch (type.toUpperCase()) {
        case 'SLOTS':
          return '🎰';
        case 'DICE':
          return '🎲';
        case 'PLINKO':
        case 'PLINKO_MASTER':
          return '📍';
        default:
          return '🎮';
      }
    };
    
    return (
      <div className="flex flex-col">
        <div className="flex items-center">
          <span className="text-lg mr-1">{getGameIcon(gameType)}</span>
          <span className="text-sm font-medium capitalize">{gameType.replace('_', ' ')}</span>
        </div>
        {transaction.type === 'win' && metadata.multiplier && (
          <span className="text-xs text-green-500">
            Multiplier: {metadata.multiplier}x
          </span>
        )}
        {transaction.type === 'bet' && metadata.betAmount && (
          <span className="text-xs text-gray-500">
            Bet: {metadata.betAmount}
          </span>
        )}
      </div>
    );
  };
  
  const getAmountDisplay = (amount: string, type: string, currency: string) => {
    const amountNum = parseFloat(amount);
    
    const getCurrencySymbol = (currencyCode: string) => {
      switch (currencyCode) {
        case 'USD': return '$';
        case 'BDT': return '৳';
        case 'INR': return '₹';
        case 'BTC': return '₿';
        default: return '';
      }
    };
    
    const formattedAmount = amountNum.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    if (type === "withdrawal" || type === "bet") {
      return <span className="text-red-500">-{getCurrencySymbol(currency)}{formattedAmount}</span>;
    } else {
      return <span className="text-green-500">+{getCurrencySymbol(currency)}{formattedAmount}</span>;
    }
  };
  
  const filteredTransactions = transactions.filter(transaction => {
    // Apply type filter
    if (typeFilter && transaction.type !== typeFilter) {
      return false;
    }
    
    // Apply search term filter (search by amount, currency, type, and status)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.amount.includes(searchTerm) ||
        transaction.currency.toLowerCase().includes(searchLower) ||
        transaction.type.toLowerCase().includes(searchLower) ||
        transaction.status.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Get transaction statistics
  const getTotalDeposits = () => {
    return transactions
      .filter(t => t.type === "deposit" && t.status === "completed")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };
  
  const getTotalWithdrawals = () => {
    return transactions
      .filter(t => t.type === "withdrawal" && t.status === "completed")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };
  
  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center mb-6">
          <ClipboardList className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold">Transaction History</h1>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-card rounded-lg p-4 shadow-md animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-400">Total Transactions</h3>
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{transactions.length}</p>
          </div>
          
          <div className="bg-card rounded-lg p-4 shadow-md animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-400">Total Deposits</h3>
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-500">
              +${getTotalDeposits().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-4 shadow-md animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-400">Total Withdrawals</h3>
              <ArrowUpRight className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-500">
              -${getTotalWithdrawals().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-4 shadow-md animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm text-gray-400">Net Balance</h3>
              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">Balance</span>
            </div>
            <p className="text-2xl font-bold text-primary">
              ${(getTotalDeposits() - getTotalWithdrawals()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        
        {/* Filter and Search */}
        <div className="bg-card rounded-lg shadow-lg p-4 mb-6 animate-fadeIn">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setTypeFilter(null)}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  typeFilter === null
                    ? 'bg-primary text-white'
                    : 'bg-background hover:bg-background-light'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter("deposit")}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                  typeFilter === "deposit"
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-background hover:bg-background-light'
                }`}
              >
                <ArrowDownLeft className="h-4 w-4 mr-1" />
                Deposits
              </button>
              <button
                onClick={() => setTypeFilter("withdrawal")}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                  typeFilter === "withdrawal"
                    ? 'bg-amber-500/20 text-amber-500'
                    : 'bg-background hover:bg-background-light'
                }`}
              >
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Withdrawals
              </button>
              <button
                onClick={() => setTypeFilter("bet")}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                  typeFilter === "bet"
                    ? 'bg-red-500/20 text-red-500'
                    : 'bg-background hover:bg-background-light'
                }`}
              >
                <span className="mr-1">🎲</span>
                Bets
              </button>
              <button
                onClick={() => setTypeFilter("win")}
                className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                  typeFilter === "win"
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-background hover:bg-background-light'
                }`}
              >
                <span className="mr-1">🏆</span>
                Wins
              </button>
            </div>
            
            <button
              onClick={fetchTransactions}
              disabled={isLoading}
              className="px-3 py-1.5 bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Transactions Table */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden animate-fadeIn">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : error ? (
              <div className="py-10 flex flex-col items-center justify-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
                <p className="text-red-500">{error}</p>
                <button
                  onClick={fetchTransactions}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <ClipboardList className="h-16 w-16 text-gray-500 mb-4" />
                {typeFilter || searchTerm ? (
                  <p className="text-gray-400">No matching transactions found</p>
                ) : (
                  <p className="text-gray-400">No transaction history yet</p>
                )}
              </div>
            ) : (
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-background-darker">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date & Time</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Game Details</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Currency</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className="hover:bg-background-light transition-colors cursor-pointer animate-fadeIn"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="text-sm">{formatDate(transaction.createdAt)}</div>
                        <div className="text-xs text-gray-500">{formatTime(transaction.createdAt)}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getTransactionTypeIcon(transaction.type)}
                          <span className="ml-2 capitalize">{transaction.type}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getGameDetails(transaction)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium">
                        {getAmountDisplay(transaction.amount, transaction.type, transaction.currency)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {transaction.currency}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getTransactionStatusBadge(transaction.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
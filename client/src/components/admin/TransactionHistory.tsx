import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Download } from "lucide-react";
import { TransactionType } from "@shared/schema";

interface Transaction {
  id: number;
  userId: number;
  amount: string;
  type: TransactionType;
  currency: string;
  createdAt: string;
}

export function TransactionHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/admin/transactions"],
  });
  
  // Filter transactions
  const filteredTransactions = transactions?.filter(transaction => {
    // Filter by search term (userId)
    const searchMatch = searchTerm === "" || transaction.userId.toString().includes(searchTerm);
    
    // Filter by transaction type
    const typeMatch = typeFilter === "all" || transaction.type === typeFilter;
    
    return searchMatch && typeMatch;
  });
  
  const handleExport = () => {
    if (!filteredTransactions) return;
    
    // Create CSV content
    const headers = ["ID", "User ID", "Amount", "Type", "Currency", "Date"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(t => [
        t.id,
        t.userId,
        t.amount,
        t.type,
        t.currency,
        new Date(t.createdAt).toISOString()
      ].join(","))
    ].join("\n");
    
    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="bg-background-darker rounded-xl p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h3 className="font-medium text-white">Transaction History</h3>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-background-light border-gray-800 rounded-lg pl-9 pr-4 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-background-light border-gray-800 text-white w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-background-light border-gray-800">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposits</SelectItem>
              <SelectItem value="withdrawal">Withdrawals</SelectItem>
              <SelectItem value="bet">Bets</SelectItem>
              <SelectItem value="win">Wins</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
            disabled={!filteredTransactions || filteredTransactions.length === 0}
            className="bg-background-light border-gray-800 text-white"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">User ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Currency</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                </td>
              </tr>
            ) : filteredTransactions && filteredTransactions.length > 0 ? (
              filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-800">
                  <td className="px-4 py-3 text-white">#{transaction.id}</td>
                  <td className="px-4 py-3 text-white">#{transaction.userId}</td>
                  <td className="px-4 py-3 text-white">
                    {formatCurrency(transaction.amount, transaction.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      transaction.type === "deposit" ? "bg-green-900 bg-opacity-30 text-green-400" :
                      transaction.type === "withdrawal" ? "bg-red-900 bg-opacity-30 text-red-400" :
                      transaction.type === "bet" ? "bg-yellow-900 bg-opacity-30 text-yellow-400" :
                      "bg-blue-900 bg-opacity-30 text-blue-400"
                    }`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">{transaction.currency}</td>
                  <td className="px-4 py-3 text-white">{formatDateTime(transaction.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

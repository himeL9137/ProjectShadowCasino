
import { createContext, useContext, useState, ReactNode } from "react";

interface BalanceContextType {
  balance: number;
  updateBalance: (amount: number) => void;
  setBalance: (balance: number) => void;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function useBalance() {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error('useBalance must be used within a BalanceProvider');
  }
  return context;
}

interface BalanceProviderProps {
  children: ReactNode;
}

export function BalanceProvider({ children }: BalanceProviderProps) {
  const [balance, setBalanceState] = useState(0); // New users start with 0 balance

  const updateBalance = (amount: number) => {
    setBalanceState((prev) => prev + amount);
  };

  const setBalance = (newBalance: number) => {
    setBalanceState(newBalance);
  };

  return (
    <BalanceContext.Provider value={{ balance, updateBalance, setBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

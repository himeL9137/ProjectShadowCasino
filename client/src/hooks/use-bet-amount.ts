import { useState } from "react";

const STORAGE_KEY = "casino_bet_amount";

export function useBetAmount(defaultAmount = "1.00") {
  const [betAmount, setBetAmountState] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || defaultAmount;
    } catch {
      return defaultAmount;
    }
  });

  const setBetAmount = (value: string) => {
    setBetAmountState(value);
    try {
      if (value && parseFloat(value) > 0) {
        localStorage.setItem(STORAGE_KEY, value);
      }
    } catch {}
  };

  const half = () => setBetAmount(Math.max(0.01, (parseFloat(betAmount) || 0) / 2).toFixed(2));
  const double = () => setBetAmount(((parseFloat(betAmount) || 0) * 2).toFixed(2));
  const setMin = () => setBetAmount("0.01");

  return { betAmount, setBetAmount, half, double, setMin };
}

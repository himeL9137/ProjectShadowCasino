export const generateRandomOutcome = (gameType: string, betAmount: number) => {
  let winChance = 0.4; // Base 40% win chance
  let maxMultiplier = 5;

  switch (gameType) {
    case "slots":
      winChance = 0.3;
      maxMultiplier = 20;
      break;
    case "table":
      winChance = 0.48;
      maxMultiplier = 2;
      break;
    case "live":
      winChance = 0.49;
      maxMultiplier = 1.95;
      break;
  }

  const isWin = Math.random() < winChance;
  const multiplier = isWin ? Math.random() * maxMultiplier + 0.1 : 0;
  const winAmount = betAmount * multiplier;

  return {
    isWin,
    multiplier: parseFloat(multiplier.toFixed(2)),
    winAmount: parseFloat(winAmount.toFixed(2)),
  };
};

export const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
};

export const getGameCategoryColor = (category: string): string => {
  switch (category) {
    case "slots":
      return "casino-green";
    case "table":
      return "casino-purple";
    case "live":
      return "casino-gold";
    default:
      return "casino-green";
  }
};

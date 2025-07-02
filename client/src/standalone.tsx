import { useState } from "react";

export default function StandaloneDemo() {
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [gameResult, setGameResult] = useState<any>(null);
  const [balance, setBalance] = useState<number>(1000);

  // Format money values
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get currency symbol
  const getCurrencySymbol = (currency: string = "USD") => {
    switch (currency) {
      case "USD":
        return "$";
      case "BDT":
        return "৳";
      case "INR":
        return "₹";
      case "BTC":
        return "₿";
      default:
        return "$";
    }
  };

  // Handle spin button click
  const handleSpin = async () => {
    if (balance < betAmount) {
      alert("Insufficient balance!");
      return;
    }

    setIsSpinning(true);
    setBalance((prev) => prev - betAmount);

    // Simulate network delay
    setTimeout(() => {
      // Randomly determine if this is a win (50/50 chance)
      const isWin = Math.random() > 0.5;

      // Create mock game result
      const mockResult = {
        isWin: isWin,
        winAmount: isWin ? betAmount * 2 : 0,
        multiplier: isWin ? 2 : 0,
        gameData: {
          reels: ["🍒", "7️⃣", "🍋", "💎", "🍊"], // Default symbols
        },
      };

      // Set a more interesting pattern for wins
      if (isWin) {
        mockResult.gameData.reels = ["🍇", "7️⃣", "7️⃣", "7️⃣", "🍒"];
        setBalance((prev) => prev + mockResult.winAmount);
      }

      setGameResult(mockResult);
      setIsSpinning(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <header className="h-16 bg-[#07070e] border-b border-[#1f1f3a] flex items-center justify-between px-6">
        <div>
          <h1 className="text-2xl font-bold">
            Shadow <span className="text-[#7c3aed]">Casino</span>
          </h1>
        </div>
        <div className="px-4 py-2 bg-[#1a1a2e] rounded-md border border-[#2d2d4a]">
          <span className="text-gray-400 mr-2">Balance:</span>
          <span className="font-bold text-white">${formatMoney(balance)}</span>
          <span className="text-xs text-gray-400 ml-1">USD</span>
        </div>
      </header>

      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Slots Game - Demo</h1>

        <div className="bg-[#1a1a2e] rounded-lg p-8">
          <div className="max-w-2xl mx-auto">
            {/* Display reels */}
            <div className="bg-[#07070e] rounded-lg p-6 mb-6">
              <div className="relative">
                {/* Win line display */}
                {gameResult?.isWin && (
                  <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-1 bg-green-500 animate-pulse z-10"></div>
                )}

                <div className="grid grid-cols-5 gap-3 relative">
                  {gameResult?.gameData?.reels
                    ? gameResult.gameData.reels.map(
                        (symbol: string, index: number) => (
                          <div
                            key={index}
                            className={`h-24 flex items-center justify-center text-4xl bg-[#1a1a2e] rounded-md border-2 overflow-hidden
                          ${
                            gameResult.isWin && index > 0 && index < 4
                              ? "border-green-500 animate-pulse"
                              : "border-[#2d2d4a]"
                          }`}
                          >
                            <div className={isSpinning ? "animate-spin" : ""}>
                              {symbol}
                            </div>

                            {/* Highlight effect for winning symbols */}
                            {gameResult.isWin && index > 0 && index < 4 && (
                              <div className="absolute inset-0 bg-green-500/10 rounded-md"></div>
                            )}
                          </div>
                        ),
                      )
                    : Array(5)
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={index}
                            className="h-24 flex items-center justify-center text-4xl bg-[#1a1a2e] rounded-md border-2 border-[#2d2d4a]"
                          >
                            {isSpinning ? (
                              <div className="animate-spin">🎰</div>
                            ) : (
                              "?"
                            )}
                          </div>
                        ))}
                </div>
              </div>
            </div>

            {/* Game controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bet controls */}
              <div className="bg-[#1a1a2e] rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Your Bet</h3>
                <div className="flex items-center mb-4">
                  <button
                    className="bg-[#07070e] rounded-l-md px-3 py-2 border border-[#2d2d4a]"
                    onClick={() => setBetAmount(Math.max(1, betAmount - 10))}
                    disabled={isSpinning}
                  >
                    -
                  </button>
                  <div className="px-4 py-2 border-t border-b border-[#2d2d4a]">
                    ${formatMoney(betAmount)}
                  </div>
                  <button
                    className="bg-[#07070e] rounded-r-md px-3 py-2 border border-[#2d2d4a]"
                    onClick={() => setBetAmount(betAmount + 10)}
                    disabled={isSpinning}
                  >
                    +
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2"></div>
              </div>

              {/* Spin button */}
              <div className="bg-[#1a1a2e] rounded-lg p-4 flex flex-col items-center justify-center">
                <button
                  className={`w-full h-full bg-[#7c3aed] rounded-lg flex flex-col items-center justify-center text-white font-bold ${
                    isSpinning
                      ? "opacity-70 cursor-not-allowed"
                      : "hover:bg-[#6d28d9]"
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
              <div className="bg-[#1a1a2e] rounded-lg p-4">
                <h3 className="text-lg font-medium mb-2">Result</h3>
                {gameResult ? (
                  <div
                    className={`p-3 rounded-md ${gameResult.isWin ? "bg-green-500/20" : "bg-red-500/20"}`}
                  >
                    <div className="text-center font-bold text-xl mb-1">
                      {gameResult.isWin ? "YOU WON!" : "YOU LOST"}
                    </div>
                    {gameResult.isWin && (
                      <div className="text-center">
                        <span className="text-green-400 font-medium">
                          ${formatMoney(gameResult.winAmount)}
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
            <div className="mt-6 p-4 bg-[#07070e] rounded-lg">
              <h3 className="font-medium mb-2">How to Play:</h3>
              <ul className="list-disc list-inside text-sm text-gray-400">
                <li>Set your bet amount using the controls</li>
                <li>Hit the SPIN button to play</li>
                <li>Match 3 symbols in the middle to win</li>
                <li>Different symbols have different payouts</li>
              </ul>
            </div>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <h3 className="text-yellow-500 font-medium mb-2">Demo Mode</h3>
              <p className="text-sm text-gray-300">
                This is a standalone demo version of the Slots game with no
                backend connectivity. Changes to your balance are simulated and
                not persistent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

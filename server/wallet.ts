import { Express, Request, Response, NextFunction } from "express";
import { authenticateJWT } from "./auth";
import { storage } from "./storage";
import { BalanceManager } from "./balance-manager";
import { Currency, TransactionType } from "@shared/schema";
import { enhancedCurrencyConverter } from './utils/enhanced-currency-converter';

/**
 * Set up wallet-related routes
 * 
 * @param app Express application
 */
export function setupWalletRoutes(app: Express): void {
  // Get user's current balance
  app.get("/api/wallet/balance", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Always get fresh user data from database to ensure correct balance
      const freshUserData = await storage.getUser(user.id);
      if (!freshUserData) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`Fetching current balance for user ${user.id}, DB value: ${freshUserData.balance} ${freshUserData.currency}`);

      res.json({
        balance: freshUserData.balance,
        currency: freshUserData.currency
      });
    } catch (error) {
      console.error("Error fetching balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  // Change user's preferred currency
  const validateCurrencyRequest = async (req: Request, res: Response, next: NextFunction) => {
  const { currency } = req.body;
  if (!currency || !Object.values(Currency).includes(currency)) {
    return res.status(400).json({ error: 'Invalid currency' });
  }
  next();
};

app.post("/api/wallet/change-currency", authenticateJWT, validateCurrencyRequest, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Get fresh user data to ensure we have the latest balance
      const freshUser = await storage.getUser(user.id);
      if (!freshUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { currency } = req.body;
      console.log(`Currency change requested: ${freshUser.currency} -> ${currency}`);

      // Validate the currency is a valid enum value
      if (!Object.values(Currency).includes(currency)) {
        console.error(`Invalid currency value received: ${currency}`);
        return res.status(400).json({ message: "Invalid currency" });
      }

      // Cast to Currency enum
      const newCurrency = currency as Currency;

      // If currency is unchanged, don't perform conversion
      if (freshUser.currency === newCurrency) {
        console.log(`Currency unchanged for user ${freshUser.id}, still ${freshUser.currency}`);
        return res.json({
          message: "Currency unchanged",
          currency: freshUser.currency,
          balance: freshUser.balance
        });
      }

      const currentAmount = parseFloat(freshUser.balance);
      console.log(`Converting ${currentAmount} from ${freshUser.currency} to ${newCurrency}`);

      // Perform the currency conversion
      try {
        let newBalance;
        try {
          newBalance = await enhancedCurrencyConverter.convert(
            currentAmount, 
            freshUser.currency as Currency, 
            newCurrency
          );

          if (isNaN(newBalance)) {
            throw new Error('Currency conversion resulted in invalid amount');
          }
        } catch (error) {
          console.error('Currency conversion failed:', error);
          return res.status(400).json({ 
            message: "Currency conversion failed",
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        console.log(`Conversion result: ${currentAmount} ${freshUser.currency} = ${newBalance} ${newCurrency}`);

        // Log the transaction
        const transaction = {
          userId: freshUser.id,
          amount: "0",
          currency: newCurrency,
          type: TransactionType.CURRENCY_CHANGE,
          metadata: {
            oldCurrency: freshUser.currency,
            newCurrency: newCurrency,
            oldBalance: freshUser.balance,
            newBalance: newBalance.toString()
          },
          timestamp: new Date()
        };

        // First update the currency in the user record
        console.log(`Updating user ${freshUser.id} currency to ${newCurrency}`);
        const updatedUser = await storage.updateUserCurrency(freshUser.id, newCurrency);

        // Then update the balance with the converted amount
        console.log(`Updating user ${freshUser.id} balance to ${newBalance}`);
        const finalUser = await storage.updateUserBalance(freshUser.id, newBalance.toString());

        // Record the transaction after successful updates
        await storage.createTransaction(transaction);
      } catch (error) {
        console.error(`Currency conversion failed for ${freshUser.id}: ${freshUser.currency} to ${newCurrency}`, error);
        return res.status(400).json({ message: "Currency conversion failed" });
      }

      // Notify connected clients via WebSocket with an enhanced message including transaction type
      if ((global as any).socketService) {
        console.log(`Sending balance update via WebSocket for user ${freshUser.id} after currency change`);

        // Get the final user data we just updated above
        const updatedUserData = await storage.getUser(freshUser.id);
        const currentBalance = updatedUserData?.balance || "0";

        // Use the enhanced sendBalanceUpdate method with currency change parameters
        (global as any).socketService.sendBalanceUpdate(
          freshUser.id, 
          currentBalance, 
          newCurrency,
          true, // isFromCurrencyChange flag
          freshUser.currency, // oldCurrency
          freshUser.balance // oldBalance
        );

        // Write the update to a file for fallback in case WebSocket fails
        try {
          const updateData = {
            userId: freshUser.id,
            oldCurrency: freshUser.currency,
            newCurrency: newCurrency,
            oldBalance: freshUser.balance,
            newBalance: currentBalance,
            timestamp: new Date().toISOString(),
            type: 'currency_changed'
          };

          // Log additional debug info
          console.log(`Currency change details for user ${freshUser.id}:`, {
            from: freshUser.currency,
            to: newCurrency,
            oldBalance: freshUser.balance,
            newBalance: currentBalance
          });
        } catch (err) {
          console.error('Error saving currency change data to fallback storage:', err);
        }
      }

      // Get final user data to confirm changes
      const confirmedUser = await storage.getUser(freshUser.id);

      console.log(`Currency change successful for user ${freshUser.id}`);
      console.log(`Final balance data from DB: ${confirmedUser?.balance} ${confirmedUser?.currency}`);

      res.json({
        message: "Currency changed successfully",
        currency: confirmedUser?.currency || newCurrency,
        balance: confirmedUser?.balance || currentBalance
      });
    } catch (error) {
      console.error("Error changing currency:", error);
      res.status(500).json({ message: "Failed to change currency" });
    }
  });

  // Process a deposit
  app.post("/api/wallet/deposit", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { amount, paymentMethod } = req.body;

      const depositAmount = parseFloat(amount);
      if (isNaN(depositAmount) || depositAmount <= 0) {
        return res.status(400).json({ message: "Invalid deposit amount" });
      }

      console.log(`Processing deposit for user ${user.id}: ${depositAmount} ${user.currency}`);

      const result = await BalanceManager.processDeposit(
        user.id,
        depositAmount,
        user.currency as Currency,
        paymentMethod || "WhatsApp"
      );

      // Send WebSocket notification to ensure client receives real-time balance update
      if ((global as any).socketService) {
        console.log(`Sending WebSocket balance update after deposit: ${result.user.balance} ${result.user.currency}`);
        (global as any).socketService.sendBalanceUpdate(
          user.id, 
          result.user.balance,
          result.user.currency
        );
      }

      // Get fresh user data to ensure we have the latest balance
      const freshUser = await storage.getUser(user.id);

      console.log(`Deposit result: Old balance=${user.balance}, New balance=${freshUser?.balance || result.user.balance}`);

      res.json({
        message: "Deposit processed successfully",
        balance: freshUser?.balance || result.user.balance,
        currency: freshUser?.currency || result.user.currency,
        transaction: result.transaction
      });
    } catch (error) {
      console.error("Error processing deposit:", error);
      res.status(500).json({ message: "Failed to process deposit" });
    }
  });

  // Process a withdrawal
  app.post("/api/wallet/withdraw", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { amount, currency, paymentMethod } = req.body;

      const withdrawalAmount = parseFloat(amount);
      if (isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        return res.status(400).json({ message: "Invalid withdrawal amount" });
      }

      // Convert withdrawal amount to user's currency if different
      const withdrawalInUserCurrency = currency !== user.currency 
        ? await currencyConverter.convert(withdrawalAmount, currency as Currency, user.currency as Currency)
        : withdrawalAmount;

      // Get fresh user data to check current balance
      const freshUser = await storage.getUser(user.id);
      if (!freshUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = parseFloat(freshUser.balance);
      if (currentBalance < withdrawalAmount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      console.log(`Processing withdrawal for user ${user.id}: ${withdrawalAmount} ${freshUser.currency}`);

      const result = await BalanceManager.processWithdrawal(
        user.id,
        withdrawalAmount,
        freshUser.currency as Currency,
        paymentMethod || "WhatsApp"
      );

      // Send WebSocket notification to ensure client receives real-time balance update
      if ((global as any).socketService) {
        console.log(`Sending WebSocket balance update after withdrawal: ${result.user.balance} ${result.user.currency}`);
        (global as any).socketService.sendBalanceUpdate(
          user.id, 
          result.user.balance,
          result.user.currency
        );
      }

      // Get updated user data to ensure we have the latest balance
      const updatedUser = await storage.getUser(user.id);

      console.log(`Withdrawal result: Old balance=${currentBalance}, New balance=${updatedUser?.balance || result.user.balance}`);

      res.json({
        message: "Withdrawal processed successfully",
        balance: updatedUser?.balance || result.user.balance,
        currency: updatedUser?.currency || result.user.currency,
        transaction: result.transaction
      });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  // Get exchange rates
  app.get("/api/wallet/exchange-rates", async (_req: Request, res: Response) => {
    try {
      // Use our enhanced currency converter for all exchange rates
      const allRates = await enhancedCurrencyConverter.getRates();
      
      res.json({
        rates: allRates,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching exchange rates:", error);
      res.status(500).json({ message: "Failed to fetch exchange rates" });
    }
  });

  // Get user's transaction history
  app.get("/api/wallet/transactions", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const transactions = await storage.getUserTransactions(user.id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });
}
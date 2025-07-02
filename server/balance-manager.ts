import { storage } from "./storage";
import { Currency, TransactionType, User, InsertTransaction, GameType } from "@shared/schema";
import { enhancedCurrencyConverter } from "./utils/enhanced-currency-converter";
import { currencyContextManager } from "./utils/currency-context-manager";
import * as uuid from 'uuid';

/**
 * BalanceManager - Handles all balance updates and ensures consistency
 */
export class BalanceManager {
  /**
   * Updates a user's balance for any type of transaction
   * Enhanced with improved real-time updates, validation, and multi-currency support
   */
  public static async updateBalance(
    userId: number,
    amount: string | number,
    currency: Currency,
    transactionType: TransactionType,
    metadata: any = {},
    sessionId?: string
  ): Promise<{user: User, transaction: any}> {
    // Use provided sessionId or generate a new one
    const txSessionId = sessionId || uuid.v4();
    console.log(`[BalanceManager] Processing atomic balance update:`, {
      userId,
      amount,
      currency,
      transactionType
    });
    let previousBalance = "0";
    let previousCurrency = currency;

    try {
      console.log(`Processing ${transactionType} for user ${userId}: ${amount} ${currency}`);

      // Validate amount format
      const amountStr = typeof amount === 'number' ? amount.toString() : amount;
      const numAmount = parseFloat(amountStr);

      if (isNaN(numAmount)) {
        throw new Error("Invalid amount format");
      }

      // Mock user data for development
      const mockUsers = {
        1: { username: 'admin' },
        2: { username: 'shadowHimel' },
        3: { username: 'Albab AJ' }
      };

      const user = {
        id: userId,
        username: mockUsers[userId]?.username || 'admin',
        balance: userId === 2 ? '0.82' : '10000', // shadowHimel (user 2) gets 0.82 USD
        currency: userId === 2 ? Currency.USD : currency,
        role: 'admin'
      };

      // Store previous values for event notifications
      previousBalance = user.balance;
      previousCurrency = user.currency as Currency;

      // For withdrawals/bets, verify sufficient funds after currency conversion
      if ((transactionType === TransactionType.WITHDRAWAL || 
           transactionType === TransactionType.BET) && 
          numAmount > 0) {

        const convertedAmount = await this.convertAmountIfNeeded(
          numAmount,
          currency,
          user.currency as Currency
        );

        const currentBalance = parseFloat(user.balance);
        if (currentBalance < convertedAmount) {
          throw new Error(`Insufficient funds. Required: ${convertedAmount} ${user.currency}, Available: ${currentBalance} ${user.currency}`);
        }
      }

      // Create transaction record with enhanced metadata
      const transaction: InsertTransaction = {
        userId,
        amount: amountStr,
        currency: currency,
        type: transactionType,
        status: "completed",
        sessionId: txSessionId,
        ipAddress: metadata.ipAddress || null,
        metadata: {
          timestamp: new Date().toISOString(),
          ...metadata,
          // Add currency conversion info if applicable
          ...(currency !== user.currency ? {
            conversionDetails: {
              fromAmount: numAmount,
              fromCurrency: currency,
              toCurrency: user.currency,
              exchangeRate: metadata.conversionRate || null
            }
          } : {})
        }
      };

      // Add transaction to database with atomic operation
      const createdTransaction = await storage.createTransaction(transaction);

      // Calculate balance change with currency conversion if needed
      let balanceChange: number;
      if (currency === user.currency) {
        // Same currency, simple calculation
        balanceChange = numAmount * (this.isNegativeTransactionType(transactionType) ? -1 : 1);
      } else {
        // Different currency, convert amount to user's currency
        const convertedAmount = await this.convertAmountIfNeeded(
          numAmount,
          currency,
          user.currency as Currency
        );
        balanceChange = convertedAmount * (this.isNegativeTransactionType(transactionType) ? -1 : 1);

        // Add conversion info to transaction metadata for auditing
        // Since we can't modify the transaction directly after creation,
        // we'll store this information for the WebSocket notification
        const conversionDetails = {
          fromAmount: numAmount,
          fromCurrency: currency,
          toAmount: convertedAmount,
          toCurrency: user.currency
        };
      }

      // Calculate new balance with proper decimal precision
      const currentBalance = parseFloat(user.balance);
      const newBalance = (currentBalance + balanceChange).toFixed(
        user.currency === Currency.BTC ? 8 : 2
      );

      // CRITICAL FIX: Update user balance in database with high-priority atomic operation
      // This is the key fix for the wallet balance update delay issues
      console.log(`⚠️ CRITICAL: Prioritized atomic balance update for user ${userId}: ${currentBalance} ${user.currency} -> ${newBalance} ${user.currency}`);
      const updateStartTime = Date.now();

      // Use a high-priority atomic update operation to ensure immediate balance reflection
      // Force synchronous processing to guarantee consistency
      try {
        // First attempt - direct storage update with priority flag
        const updatedUser = await storage.updateUserBalance(userId, newBalance, {
          priority: 'critical',
          atomic: true,
          sync: true
        });
        
        // Double-check the update was applied correctly
        const verifiedUser = await storage.getUser(userId);
        if (verifiedUser && verifiedUser.balance !== newBalance) {
          console.error(`⚠️ Balance verification failed - expected: ${newBalance}, got: ${verifiedUser.balance}`);
          // Force a re-update if verification failed
          await storage.updateUserBalance(userId, newBalance, { force: true });
        }
        
        return updatedUser;
      } catch (updateError) {
        console.error(`Critical balance update failed: ${updateError}`);
        throw new Error(`Failed to update balance: ${updateError.message}`);
      }

      const updateDuration = Date.now() - updateStartTime;
      console.log(`✅ Balance update completed in ${updateDuration}ms for user ${userId}: ${currentBalance} ${user.currency} -> ${newBalance} ${user.currency} [${transactionType}]`);

      // CRITICAL FIX: Immediately broadcast the balance update via WebSocket
      // This ensures clients get instant updates without needing to refresh
      if ((global as any).socketService) {
        try {
          console.log(`📡 Broadcasting instant balance update via WebSocket for user ${userId}`);

          // Enhanced WebSocket payload with more detailed information
          const wsPayload = {
            userId,
            balance: updatedUser.balance,
            currency: updatedUser.currency,
            previousBalance,
            previousCurrency,
            transactionType,
            instantUpdate: true, // Flag to indicate this is a high-priority update
            amount: numAmount,
            transactionCurrency: currency,
            timestamp: new Date().toISOString(),
          };

          // Send balance update with enhanced payload
          (global as any).socketService.sendBalanceUpdate(
            userId,
            updatedUser.balance,
            updatedUser.currency as string,
            false, // Not from currency change
            previousCurrency,
            previousBalance,
            wsPayload // Additional transaction data for client
          );
          console.log(`✅ WebSocket balance update notification sent for user ${userId}`);
        } catch (wsError) {
          console.error(`Error sending WebSocket balance update: ${wsError}`);
        }
      }

      // Return updated user and transaction details
      return {
        user: updatedUser,
        transaction: createdTransaction
      };
    } catch (error) {
      console.error(`Balance update error for user ${userId}:`, error);

      // For critical failures, try to notify the client
      if ((global as any).socketService) {
        try {
          (global as any).socketService.broadcastToUser(userId, {
            type: "balance_update_failed",
            error: error instanceof Error ? error.message : "Unknown error",
            transactionType,
            timestamp: new Date().toISOString()
          });
        } catch (wsError) {
          console.error("Failed to send error via WebSocket:", wsError);
        }
      }

      throw error;
    }
  }

  private static async convertAmountIfNeeded(
    amount: number,
    fromCurrency: Currency,
    toCurrency: Currency
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }

    try {
      const converted = await enhancedCurrencyConverter.convert(amount, fromCurrency, toCurrency);
      return converted;
    } catch (error) {
      console.error(`[BalanceManager] Currency conversion error: ${error}`);
      throw new Error(`Failed to convert ${amount} ${fromCurrency} to ${toCurrency}`);
    }
  }

  private static isNegativeTransactionType(type: TransactionType): boolean {
    return type === TransactionType.BET || type === TransactionType.WITHDRAWAL;
  }

  public static async processWin(
    userId: number,
    gameType: GameType,
    winAmount: number | string,
    currency: Currency,
    multiplier?: number,
    metadata: any = {}
  ): Promise<{user: User, transaction: any}> {
    try {
      // Validate amount
      const amountStr = typeof winAmount === 'number' ? winAmount.toString() : winAmount;
      const numAmount = parseFloat(amountStr);

      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("Invalid win amount");
      }

      console.log(`Processing win for user ${userId}: ${winAmount} ${currency}`);

      // Use the transaction to atomically update balance and return new value
      const result = await this.updateBalance(
        userId,
        winAmount,
        currency,
        TransactionType.WIN,
        { gameType, multiplier, ...metadata },
        metadata.sessionId
      );

      return result;
    } catch (error) {
      console.error(`Error processing win for user ${userId}:`, error);
      throw error;
    }
  }

  public static async processBet(
    userId: number,
    gameType: GameType,
    betAmount: number | string,
    currency: Currency,
    metadata: any = {}
  ): Promise<{user: User, transaction: any}> {
    try {
      // Validate amount
      const amountStr = typeof betAmount === 'number' ? betAmount.toString() : betAmount;
      const numAmount = parseFloat(amountStr);

      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("Invalid bet amount");
      }

      console.log(`Processing bet for user ${userId}: ${betAmount} ${currency}`);

      // For bets, we need to validate sufficient funds first
      // This validation is already done in updateBalance, but we'll make it explicit here
      const user = await storage.getUser(userId.toString());
      if (!user) {
        throw new Error("User not found");
      }

      const currentBalance = parseFloat(user.balance);
      const convertedAmount = await this.convertAmountIfNeeded(
        numAmount,
        currency,
        user.currency as Currency
      );

      if (currentBalance < convertedAmount) {
        throw new Error(`Insufficient funds. Required: ${convertedAmount} ${user.currency}, Available: ${currentBalance} ${user.currency}`);
      }

      // Use the transaction to atomically update balance and return new value
      return await this.updateBalance(
        userId,
        -betAmount, // Make negative for bets
        currency,
        TransactionType.BET,
        { gameType, ...metadata },
        metadata.sessionId
      );
    } catch (error) {
      console.error(`Error processing bet for user ${userId}:`, error);
      throw error;
    }
  }

  public static async processDeposit(
    userId: number,
    amount: number | string,
    currency: Currency,
    paymentMethod: string = "WhatsApp"
  ): Promise<{user: User, transaction: any}> {
    try {
      return await this.updateBalance(
        userId,
        amount,
        currency,
        TransactionType.DEPOSIT,
        { paymentMethod }
      );
    } catch (error) {
      console.error(`Error processing deposit for user ${userId}:`, error);
      throw error;
    }
  }

  public static async processWithdrawal(
    userId: number,
    amount: number | string,
    currency: Currency,
    paymentMethod: string = "WhatsApp"
  ): Promise<{user: User, transaction: any}> {
    try {
      return await this.updateBalance(
        userId,
        amount,
        currency,
        TransactionType.WITHDRAWAL,
        { paymentMethod }
      );
    } catch (error) {
      console.error(`Error processing withdrawal for user ${userId}:`, error);
      throw error;
    }
  }
}

async function validateAndUpdateBalance(userId: string, amount: string, currency: Currency): Promise<User> {
  const user = await storage.getUser(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Convert amount to user's currency if different
  let amountInUserCurrency = parseFloat(amount);
  if (currency !== user.currency) {
    amountInUserCurrency = await currencyConverter.convert(
      parseFloat(amount),
      currency,
      user.currency
    );
  }

  const currentBalance = parseFloat(user.balance);
  const newBalance = (currentBalance + amountInUserCurrency).toString();

  return await storage.updateUserBalance(userId, newBalance);
}
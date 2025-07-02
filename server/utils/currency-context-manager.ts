import { Currency } from '@shared/schema';
import { enhancedCurrencyConverter } from './enhanced-currency-converter';
import { storage } from '../storage';

/**
 * CurrencyContextManager provides a centralized way to handle user currency 
 * preferences and ensure consistent currency handling across all casino games.
 */
export class CurrencyContextManager {
    private static instance: CurrencyContextManager;
    
    private constructor() {}
    
    static getInstance(): CurrencyContextManager {
        if (!CurrencyContextManager.instance) {
            CurrencyContextManager.instance = new CurrencyContextManager();
        }
        return CurrencyContextManager.instance;
    }
    
    /**
     * Gets the user's selected currency, safely handling potential errors
     */
    async getUserCurrency(userId: number): Promise<Currency> {
        try {
            const user = await storage.getUser(userId);
            if (!user) {
                console.error(`[CurrencyContext] User not found: ${userId}`);
                return Currency.USD; // Default to USD if user not found
            }
            
            if (!user.currency || !enhancedCurrencyConverter.isValidCurrency(user.currency)) {
                console.error(`[CurrencyContext] Invalid currency for user ${userId}: ${user.currency}`);
                return Currency.USD;
            }
            
            return user.currency as Currency;
        } catch (error) {
            console.error(`[CurrencyContext] Error getting user currency: ${error}`);
            return Currency.USD;
        }
    }
    
    /**
     * Processes a bet amount, ensuring it's in the user's preferred currency
     * 
     * @param userId The user placing the bet
     * @param betAmount The amount bet
     * @param gameCurrency The currency in which the bet is placed
     * @returns Object containing normalized bet info and user currency
     */
    async processBet(
        userId: number,
        betAmount: number,
        gameCurrency: Currency
    ): Promise<{
        userCurrency: Currency;
        normalizedBetAmount: number;
        conversionRate: number | null;
        displayAmount: number;
    }> {
        // Retrieve the user's preferred currency
        const userCurrency = await this.getUserCurrency(userId);
        
        // If game currency matches user currency, no conversion needed
        if (gameCurrency === userCurrency) {
            return {
                userCurrency,
                normalizedBetAmount: betAmount,
                conversionRate: 1,
                displayAmount: betAmount
            };
        }
        
        // Conversion needed - the bet amount is in game currency but needs to be in user currency
        try {
            // Get the conversion rate
            const conversionRate = await enhancedCurrencyConverter.getExchangeRate(
                gameCurrency,
                userCurrency
            );
            
            // Convert the bet amount to user currency
            const normalizedBetAmount = await enhancedCurrencyConverter.convert(
                betAmount,
                gameCurrency,
                userCurrency
            );
            
            return {
                userCurrency,
                normalizedBetAmount,
                conversionRate,
                displayAmount: betAmount  // Original amount for display in game currency
            };
        } catch (error) {
            console.error(`[CurrencyContext] Error processing bet: ${error}`);
            throw new Error(`Failed to process bet: currency conversion error`);
        }
    }
    
    /**
     * Processes a win amount, ensuring it's in the user's preferred currency
     * 
     * @param userId The user who won
     * @param winAmount The amount won
     * @param gameCurrency The currency in which the win is calculated
     * @returns Object containing normalized win info and user currency
     */
    async processWin(
        userId: number,
        winAmount: number,
        gameCurrency: Currency
    ): Promise<{
        userCurrency: Currency;
        normalizedWinAmount: number;
        conversionRate: number | null;
        displayAmount: number;
    }> {
        // Similar logic to processBet
        const userCurrency = await this.getUserCurrency(userId);
        
        if (gameCurrency === userCurrency) {
            return {
                userCurrency,
                normalizedWinAmount: winAmount,
                conversionRate: 1,
                displayAmount: winAmount
            };
        }
        
        try {
            const conversionRate = await enhancedCurrencyConverter.getExchangeRate(
                gameCurrency,
                userCurrency
            );
            
            const normalizedWinAmount = await enhancedCurrencyConverter.convert(
                winAmount,
                gameCurrency,
                userCurrency
            );
            
            return {
                userCurrency,
                normalizedWinAmount,
                conversionRate,
                displayAmount: winAmount
            };
        } catch (error) {
            console.error(`[CurrencyContext] Error processing win: ${error}`);
            throw new Error(`Failed to process win: currency conversion error`);
        }
    }
    
    /**
     * Ensures a valid currency is provided, or defaults to USD
     * 
     * @param currency The currency to validate
     * @returns A valid Currency enum value
     */
    ensureValidCurrency(currency: any): Currency {
        if (currency && enhancedCurrencyConverter.isValidCurrency(currency)) {
            return currency as Currency;
        }
        console.warn(`[CurrencyContext] Invalid currency provided: ${currency}, defaulting to USD`);
        return Currency.USD;
    }
    
    /**
     * Gets the exchange rates for all supported currencies
     */
    async getExchangeRates(baseCurrency: Currency = Currency.USD): Promise<Record<string, number>> {
        const rates = await enhancedCurrencyConverter.getRates();
        
        // If base is USD, return rates directly
        if (baseCurrency === Currency.USD) {
            return rates;
        }
        
        // Otherwise, normalize rates to the requested base currency
        const baseRate = rates[baseCurrency];
        const normalizedRates: Record<string, number> = {};
        
        for (const [currency, rate] of Object.entries(rates)) {
            normalizedRates[currency] = rate / baseRate;
        }
        
        return normalizedRates;
    }
}

// Singleton instance
export const currencyContextManager = CurrencyContextManager.getInstance();
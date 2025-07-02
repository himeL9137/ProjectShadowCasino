
import { Currency } from "@shared/schema";
import { enhancedCurrencyConverter } from "./server/utils/enhanced-currency-converter";
import { storage } from "./server/storage";
import { currencyContextManager } from "./server/utils/currency-context-manager";

async function testCurrencySystem() {
  try {
    console.log('Starting currency system tests...');

    // Test currency conversion
    const testAmount = 100;
    const currencies = [Currency.USD, Currency.BDT, Currency.INR, Currency.BTC];
    
    for (const fromCurrency of currencies) {
      for (const toCurrency of currencies) {
        if (fromCurrency === toCurrency) continue;
        
        const converted = await enhancedCurrencyConverter.convert(testAmount, fromCurrency, toCurrency);
        console.log(`${testAmount} ${fromCurrency} = ${converted} ${toCurrency}`);
        
        // Verify reverse conversion approximately equals original amount
        const reverseConverted = await enhancedCurrencyConverter.convert(converted, toCurrency, fromCurrency);
        const tolerance = fromCurrency === Currency.BTC ? 0.00000001 : 0.01;
        
        if (Math.abs(testAmount - reverseConverted) > tolerance) {
          throw new Error(`Conversion mismatch: ${testAmount} ${fromCurrency} -> ${converted} ${toCurrency} -> ${reverseConverted} ${fromCurrency}`);
        }
      }
    }

    // Test currency context management
    const userId = 1;
    const betAmount = 10;
    const gameCurrency = Currency.BDT;
    
    const result = await currencyContextManager.processBet(userId, betAmount, gameCurrency);
    console.log('Bet processing result:', result);
    
    console.log('All tests passed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testCurrencySystem();

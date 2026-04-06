# Balance-Threshold Rule Engine - API Examples

## Example 1: Player Under Threshold (Can Win)

### Scenario
- Player: Bangladesh user
- Balance: 18,000 BDT
- Currency: BDT
- Game: Slots
- Bet: 200 BDT

### API Request
```bash
curl -X POST http://localhost:5000/api/rule-engine/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_bd_001",
    "balance": "18000",
    "currencyCode": "BDT",
    "betAmount": "200",
    "gameType": "SLOTS"
  }'
```

### API Response
```json
{
  "success": true,
  "outcome": {
    "isWin": true,
    "ruleMode": "UNDER_THRESHOLD",
    "canWin": true,
    "balanceEvaluation": {
      "balance": "18000",
      "currencyCode": "BDT",
      "exchangeRate": "122.4267",
      "usdThreshold": "150",
      "localThreshold": "18364.005",
      "balanceInUsd": "147.0272",
      "ruleMode": "UNDER_THRESHOLD",
      "winProbability": 0.5,
      "lossProbability": 0.5
    }
  }
}
```

### Explanation
- Player's balance in USD: 18,000 ÷ 122.4267 = 147.03 USD
- Threshold: 150 USD
- 147.03 < 150 ✓ → UNDER_THRESHOLD
- Player CAN WIN with 50% probability
- Result in this case: WIN (could be LOSE too with 50% chance)

---

## Example 2: Player At Threshold (Forced Loss)

### Scenario
- Player: Bangladesh user
- Balance: 18,400 BDT (exactly at threshold)
- Currency: BDT
- Game: Dice
- Bet: 100 BDT

### API Request
```bash
curl -X POST http://localhost:5000/api/rule-engine/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_bd_002",
    "balance": "18400",
    "currencyCode": "BDT",
    "betAmount": "100",
    "gameType": "DICE"
  }'
```

### API Response
```json
{
  "success": true,
  "outcome": {
    "isWin": false,
    "ruleMode": "FORCED_LOSS",
    "canWin": false,
    "balanceEvaluation": {
      "balance": "18400",
      "currencyCode": "BDT",
      "exchangeRate": "122.4267",
      "usdThreshold": "150",
      "localThreshold": "18364.005",
      "balanceInUsd": "150.2940",
      "ruleMode": "FORCED_LOSS",
      "winProbability": 0,
      "lossProbability": 1
    }
  }
}
```

### Explanation
- Player's balance in USD: 18,400 ÷ 122.4267 = 150.29 USD
- Threshold: 150 USD
- 150.29 >= 150 ✓ → FORCED_LOSS
- Player CANNOT WIN (0% win probability)
- Result: Always LOSE

---

## Example 3: Player Far Above Threshold

### Scenario
- Player: India user
- Balance: 50,000 INR (far above threshold)
- Currency: INR
- Game: Plinko
- Bet: 1,000 INR

### API Request
```bash
curl -X POST http://localhost:5000/api/rule-engine/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_in_001",
    "balance": "50000",
    "currencyCode": "INR",
    "betAmount": "1000",
    "gameType": "PLINKO"
  }'
```

### API Response
```json
{
  "success": true,
  "outcome": {
    "isWin": false,
    "ruleMode": "FORCED_LOSS",
    "canWin": false,
    "balanceEvaluation": {
      "balance": "50000",
      "currencyCode": "INR",
      "exchangeRate": "83.5",
      "usdThreshold": "150",
      "localThreshold": "12525",
      "balanceInUsd": "599.0299",
      "ruleMode": "FORCED_LOSS",
      "winProbability": 0,
      "lossProbability": 1
    }
  }
}
```

### Explanation
- Player's balance in USD: 50,000 ÷ 83.5 = 599.03 USD
- Threshold: 150 USD
- 599.03 >= 150 ✓ → FORCED_LOSS
- Player CANNOT WIN (far above threshold)
- Result: Always LOSE

---

## Example 4: Player Just Below Threshold (Edge Case)

### Scenario
- Player: USA user
- Balance: 149.99 USD (just below threshold)
- Currency: USD
- Game: Mines
- Bet: 10 USD

### API Request
```bash
curl -X POST http://localhost:5000/api/rule-engine/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_us_001",
    "balance": "149.99",
    "currencyCode": "USD",
    "betAmount": "10",
    "gameType": "MINES"
  }'
```

### API Response
```json
{
  "success": true,
  "outcome": {
    "isWin": false,
    "ruleMode": "UNDER_THRESHOLD",
    "canWin": true,
    "balanceEvaluation": {
      "balance": "149.99",
      "currencyCode": "USD",
      "exchangeRate": "1",
      "usdThreshold": "150",
      "localThreshold": "150",
      "balanceInUsd": "149.99",
      "ruleMode": "UNDER_THRESHOLD",
      "winProbability": 0.5,
      "lossProbability": 0.5
    }
  }
}
```

### Explanation
- Player's balance: 149.99 USD
- Threshold: 150 USD
- 149.99 < 150 ✓ → UNDER_THRESHOLD
- Player CAN WIN with 50% probability
- Result in this case: LOSE (but could be WIN with 50% chance)

---

## Example 5: Get Threshold Information

### Request
```bash
curl http://localhost:5000/api/rule-engine/threshold/EUR
```

### Response
```json
{
  "success": true,
  "threshold": {
    "usdThreshold": "150",
    "localThreshold": "138",
    "exchangeRate": "0.92",
    "currencyCode": "EUR"
  }
}
```

### Explanation
- Threshold: 150 USD = 138 EUR
- Exchange rate: 1 USD = 0.92 EUR
- In EUR: Players with < 138 EUR can win

---

## Example 6: Check if Player Can Win

### Request
```bash
curl "http://localhost:5000/api/rule-engine/can-win?balance=18000&currencyCode=BDT"
```

### Response
```json
{
  "success": true,
  "canWin": true
}
```

### Request (Can't Win)
```bash
curl "http://localhost:5000/api/rule-engine/can-win?balance=18400&currencyCode=BDT"
```

### Response
```json
{
  "success": true,
  "canWin": false
}
```

---

## Example 7: Get Balance Evaluation

### Request
```bash
curl "http://localhost:5000/api/rule-engine/evaluation/GBP?balance=120"
```

### Response
```json
{
  "success": true,
  "evaluation": {
    "balance": "120",
    "currencyCode": "GBP",
    "exchangeRate": "0.79",
    "usdThreshold": "150",
    "localThreshold": "118.5",
    "balanceInUsd": "151.8989",
    "ruleMode": "FORCED_LOSS",
    "winProbability": 0,
    "lossProbability": 1
  }
}
```

### Explanation
- Player has 120 GBP
- Threshold: 150 USD = 118.5 GBP
- 120 >= 118.5 → FORCED_LOSS
- Player cannot win

---

## Example 8: Get Supported Currencies

### Request
```bash
curl http://localhost:5000/api/rule-engine/supported-currencies
```

### Response
```json
{
  "success": true,
  "currencies": [
    "USD", "BDT", "EUR", "INR", "PKR", "GBP", "JPY", "AED",
    "CAD", "AUD", "CHF", "SEK", "NOK", "DKK", "PLN", "HKD",
    "SGD", "THB", "KRW", "IDR", "MXN", "BRL", "ZAR", "ILS", "CNY"
  ]
}
```

---

## Example 9: Multiple Scenarios in Sequence

### Scenario: Player Progresses from Poor to Rich

#### Round 1: Starting with 100 USD (Under Threshold)

```bash
curl -X POST http://localhost:5000/api/rule-engine/evaluate \
  -d '{"userId":"u1","balance":"100","currencyCode":"USD","betAmount":"10","gameType":"SLOTS"}'
```

Response:
```json
{
  "outcome": {
    "isWin": true,
    "ruleMode": "UNDER_THRESHOLD",
    "canWin": true,
    "balanceEvaluation": {
      "balance": "100",
      "ruleMode": "UNDER_THRESHOLD",
      "winProbability": 0.5
    }
  }
}
```

#### Round 2: After winning several times, now at 200 USD (Above Threshold)

```bash
curl -X POST http://localhost:5000/api/rule-engine/evaluate \
  -d '{"userId":"u1","balance":"200","currencyCode":"USD","betAmount":"10","gameType":"SLOTS"}'
```

Response:
```json
{
  "outcome": {
    "isWin": false,
    "ruleMode": "FORCED_LOSS",
    "canWin": false,
    "balanceEvaluation": {
      "balance": "200",
      "ruleMode": "FORCED_LOSS",
      "winProbability": 0
    }
  }
}
```

### Explanation
- Player started with 100 USD: Could win (50% chance)
- After winning, now at 200 USD: Cannot win anymore (forced loss)
- This is the intended behavior

---

## Example 10: Error Responses

### Missing Required Fields
```bash
curl -X POST http://localhost:5000/api/rule-engine/evaluate \
  -d '{"userId":"u1"}'
```

Response:
```json
{
  "error": "Missing required fields: userId, balance, currencyCode, betAmount, gameType"
}
```

### Unsupported Currency
```bash
curl "http://localhost:5000/api/rule-engine/threshold/XYZ"
```

Response:
```json
{
  "error": "Failed to get threshold info",
  "message": "Unsupported currency code: XYZ"
}
```

### Invalid Balance
```bash
curl -X POST http://localhost:5000/api/rule-engine/evaluate \
  -d '{"userId":"u1","balance":"abc","currencyCode":"USD","betAmount":"10","gameType":"SLOTS"}'
```

Response:
```json
{
  "error": "Failed to evaluate game round",
  "message": "Invalid decimal value: abc"
}
```

---

## Summary of Key Differences

### Under Threshold (Balance < 150 USD)
```
Input:  balance=100 USD, gameType=SLOTS
Output: isWin=true/false (50% each), winProbability=0.5
```

### Forced Loss (Balance >= 150 USD)
```
Input:  balance=200 USD, gameType=SLOTS
Output: isWin=false, winProbability=0
```

### Multi-Currency Example
```
Input:  balance=18000 BDT, currencyCode=BDT
Conversion: 18000 BDT ÷ 122.4267 = 147.03 USD
Comparison: 147.03 < 150 → UNDER_THRESHOLD → Can Win
```

---

## Testing Checklist

- [ ] Test threshold endpoint for each currency
- [ ] Test can-win with balance just below threshold
- [ ] Test can-win with balance at threshold
- [ ] Test can-win with balance far above threshold
- [ ] Test evaluation endpoint with multiple currencies
- [ ] Test error handling with invalid inputs
- [ ] Verify database logging for evaluations
- [ ] Check that each game type is supported
- [ ] Verify exchange rates are current
- [ ] Test with edge cases (0 balance, very large balance, etc.)

---

## Notes

- All balances are treated as strings to preserve precision
- Exchange rates are cached for 5 minutes
- Results are logged to `game_rule_evaluations` table
- Rules apply consistently across all game types
- No changes to existing game logic required

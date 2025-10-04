// Coin system configuration and utilities

type CoinTransaction = {
  amount: number;
  type: 'earn' | 'spend';
  reason: string;
  timestamp: number;
};

// In-memory store for demo purposes
// In a real app, you'd want to persist this to AsyncStorage or a backend
let userCoins: number = 0;
const transactionHistory: CoinTransaction[] = [];

/**
 * Initialize the coin system with a starting balance
 * @param initialCoins - Optional initial coin balance (default: 0)
 */
export const initializeCoins = (initialCoins: number = 0): void => {
  userCoins = initialCoins;
};

/**
 * Get the current coin balance
 * @returns Current number of coins
 */
export const getCoinBalance = (): number => {
  return userCoins;
};

/**
 * Add coins to the user's balance
 * @param amount - Number of coins to add
 * @param reason - Reason for earning coins (e.g., 'completed_quiz', 'daily_reward')
 * @returns New coin balance
 */
export const addCoins = (amount: number, reason: string): number => {
  if (amount <= 0) {
    console.warn('Cannot add zero or negative coins');
    return userCoins;
  }
  
  userCoins += amount;
  
  // Record the transaction
  transactionHistory.push({
    amount,
    type: 'earn',
    reason,
    timestamp: Date.now(),
  });
  
  return userCoins;
};

/**
 * Spend coins from the user's balance
 * @param amount - Number of coins to spend
 * @param reason - Reason for spending coins (e.g., 'hint', 'skip_question')
 * @returns New coin balance if successful, -1 if insufficient funds
 */
export const spendCoins = (amount: number, reason: string): number => {
  if (amount <= 0) {
    console.warn('Cannot spend zero or negative coins');
    return userCoins;
  }
  
  if (userCoins < amount) {
    console.warn('Insufficient coins');
    return -1; // Indicate insufficient funds
  }
  
  userCoins -= amount;
  
  // Record the transaction
  transactionHistory.push({
    amount,
    type: 'spend',
    reason,
    timestamp: Date.now(),
  });
  
  return userCoins;
};

/**
 * Get the transaction history
 * @returns Array of all transactions
 */
export const getTransactionHistory = (): CoinTransaction[] => {
  return [...transactionHistory];
};

// Default export for backward compatibility
export default {
  initializeCoins,
  getCoinBalance,
  addCoins,
  spendCoins,
  getTransactionHistory,
};

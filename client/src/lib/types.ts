export enum Currency {
  USD = "USD",
  BDT = "BDT",
  INR = "INR",
  BTC = "BTC"
}

export enum GameType {
  SLOTS = "slots",
  DICE = "dice",
  PLINKO = "plinko",
  CRASH = "crash"
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin"
}

export enum TransactionType {
  DEPOSIT = "deposit",
  WITHDRAWAL = "withdrawal",
  BET = "bet",
  WIN = "win"
}

export type User = {
  id: number;
  username: string;
  email: string;
  balance: string;
  currency: string;
  role: string;
  isMuted: boolean;
  isBanned: boolean;
}

export type GameHistory = {
  id: number;
  userId: number;
  gameType: GameType;
  betAmount: string;
  winAmount: string;
  multiplier: number;
  currency: Currency;
  isWin: boolean;
  gameData?: any;
  createdAt: string;
}

export type Transaction = {
  id: number;
  userId: number;
  amount: string;
  currency: Currency;
  type: TransactionType;
  status: string;
  metadata?: any;
  createdAt: string;
}
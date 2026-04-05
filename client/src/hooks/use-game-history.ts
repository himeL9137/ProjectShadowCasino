import { useState } from "react";

export interface HistoryEntry {
  game: string;
  isWin: boolean;
  betAmount: number;
  winAmount: number;
  multiplier: number;
  detail?: string;
  timestamp: number;
}

const STORAGE_KEY = "casino_game_history";
const MAX_ENTRIES = 50;

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {}
}

export function useGameHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());

  const addEntry = (entry: Omit<HistoryEntry, "timestamp">) => {
    const newEntry: HistoryEntry = { ...entry, timestamp: Date.now() };
    setHistory((prev) => {
      const next = [newEntry, ...prev].slice(0, MAX_ENTRIES);
      saveHistory(next);
      return next;
    });
  };

  return { history, addEntry };
}

import { useState, useCallback } from 'react';
import { addCoins as addCoinsUtil } from '@/utils/coinSystem';

interface UseCoinSystemReturn {
  coins: number;
  formatCoins: (amount: number) => string;
  addCoins: (amount: number) => void;
  deductCoins: (amount: number) => boolean;
  startTimer: (duration?: number) => void;
  stopTimer: (isCorrect?: boolean) => number;
  resetCoins: () => void;
  currentTimeSpent: () => number;
  timeLeft: number;
  isTimerRunning: boolean;
}

export function useCoinSystem(initialCoins: number = 0): UseCoinSystemReturn {
  const [coins, setCoins] = useState(initialCoins);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerDuration, setTimerDuration] = useState<number>(180); // 3 minutes default
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const formatCoins = useCallback((amount: number): string => {
    return amount.toLocaleString();
  }, []);

  const startTimer = useCallback((duration: number = 180): void => {
    setTimerDuration(duration);
    setStartTime(Date.now());
    setEndTime(Date.now() + duration * 1000);
    setIsTimerRunning(true);
  }, []);

  const stopTimer = useCallback((isCorrect: boolean = false): number => {
    if (!startTime) return 0;
    
    const endTimestamp = Date.now();
    const timeElapsed = Math.floor((endTimestamp - startTime) / 1000); // in seconds
    setTimeSpent(timeElapsed);
    
    // Calculate coins based on time and correctness
    let coinsEarned = 0;
    if (isCorrect) {
      // More coins for faster answers (max 10 coins, min 1 coin)
      coinsEarned = Math.max(1, Math.min(10, Math.floor(30 / (timeElapsed + 1))));
      setCoins(prev => prev + coinsEarned);
    }
    
    setStartTime(null);
    setEndTime(null);
    setIsTimerRunning(false);
    return coinsEarned;
  }, [startTime]);

  const addCoins = useCallback((amount: number): void => {
    setCoins(prev => prev + amount);
  }, []);

  const deductCoins = useCallback((amount: number): boolean => {
    if (coins >= amount) {
      setCoins(prev => prev - amount);
      return true;
    }
    return false;
  }, [coins]);

  const resetCoins = useCallback((): void => {
    setCoins(initialCoins);
    setTimeSpent(0);
    setStartTime(null);
  }, [initialCoins]);

  const currentTimeSpent = useCallback((): number => {
    if (!startTime) return timeSpent;
    return Math.floor((Date.now() - startTime) / 1000);
  }, [startTime, timeSpent]);

  // Calculate time left in seconds
  const timeLeft = endTime ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000)) : 0;
  
  // Auto-stop timer when time is up
  if (isTimerRunning && timeLeft <= 0) {
    stopTimer();
  }

  return {
    coins,
    formatCoins,
    addCoins,
    deductCoins,
    startTimer,
    stopTimer,
    resetCoins,
    currentTimeSpent: () => timeSpent,
    timeLeft,
    isTimerRunning,
  };
}

export default useCoinSystem;

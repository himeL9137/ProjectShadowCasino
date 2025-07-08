import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Advanced debounce hook with cancellation and immediate option
 */
export function useDebounce<T>(value: T, delay: number, options?: {
  immediate?: boolean;
  maxWait?: number;
}) {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const maxTimeoutRef = useRef<NodeJS.Timeout>();
  const lastCallTime = useRef<number>(0);
  
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTime.current;
    
    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    
    // Immediate execution on first call
    if (options?.immediate && timeSinceLastCall > delay) {
      setDebouncedValue(value);
      lastCallTime.current = now;
      return;
    }
    
    // Regular debounce
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      lastCallTime.current = Date.now();
    }, delay);
    
    // Max wait protection
    if (options?.maxWait && timeSinceLastCall > options.maxWait) {
      maxTimeoutRef.current = setTimeout(() => {
        setDebouncedValue(value);
        lastCallTime.current = Date.now();
      }, options.maxWait - timeSinceLastCall);
    }
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
    };
  }, [value, delay, options?.immediate, options?.maxWait]);
  
  // Cancel function
  const cancel = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (maxTimeoutRef.current) clearTimeout(maxTimeoutRef.current);
  }, []);
  
  // Flush function - execute immediately
  const flush = useCallback(() => {
    cancel();
    setDebouncedValue(value);
    lastCallTime.current = Date.now();
  }, [cancel, value]);
  
  return { debouncedValue, cancel, flush };
}

/**
 * Simplified debounce hook for basic use cases
 */
export function useSimpleDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  
  return debouncedValue;
}

/**
 * Debounced callback hook
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  
  return debouncedCallback;
}
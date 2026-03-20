import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // 使用 ref 存储初始值，避免依赖数组变化导致无限循环
  const initialValueRef = useRef(initialValue);
  const initializedRef = useRef(false);
  const [storedValue, setStoredValue] = useState<T>(initialValueRef.current);

  // 当 key 改变时重新读取
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      } else {
        setStoredValue(initialValueRef.current);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key]); // 注意：不依赖 initialValue，使用 ref 存储

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue((currentValue) => {
        const valueToStore = value instanceof Function ? value(currentValue) : value;
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
        return valueToStore;
      });
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

export function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), timeout);
      return true;
    } catch {
      return false;
    }
  }, [timeout]);

  return { copied, copy };
}

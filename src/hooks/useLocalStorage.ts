import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // 使用 ref 存储初始值，避免依赖数组变化导致无限循环
  const initialValueRef = useRef(initialValue);
  const initializedRef = useRef(false);
  
  const [storedValue, setStoredValue] = useState<T>(() => {
    // 在初始化时直接读取 localStorage，避免闪烁
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValueRef.current;
    } catch {
      return initialValueRef.current;
    }
  });

  // 当 key 改变时重新读取
  useEffect(() => {
    if (initializedRef.current) {
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
    } else {
      initializedRef.current = true;
    }
  }, [key]); // 注意：不依赖 initialValue，使用 ref 存储

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

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

import { useState, useCallback } from 'react';

/**
 * Custom hook for localStorage with enhanced error handling and type safety
 * @param key - localStorage key
 * @param initialValue - initial value if key doesn't exist
 * @returns [storedValue, setValue] tuple
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

/**
 * Hook for handling localStorage with date parsing
 * Useful for objects that contain Date fields
 */
export const useLocalStorageWithDates = <T>(
  key: string,
  initialValue: T,
  dateFields: string[] = []
) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        // Parse date fields if they exist
        if (Array.isArray(parsed)) {
          return parsed.map((obj: any) => {
            const newObj = { ...obj };
            dateFields.forEach(field => {
              if (newObj[field]) {
                newObj[field] = new Date(newObj[field]);
              }
            });
            return newObj;
          }) as T;
        } else if (parsed && typeof parsed === 'object') {
          const newObj = { ...parsed };
          dateFields.forEach(field => {
            if (newObj[field]) {
              newObj[field] = new Date(newObj[field]);
            }
          });
          return newObj as T;
        }
        return parsed;
      }
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
};

/**
 * Hook for clearing localStorage
 */
export const useClearStorage = () => {
  const clearAll = useCallback(() => {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }, []);

  const clearItem = useCallback((key: string) => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, []);

  return { clearAll, clearItem };
};

/**
 * Hook for checking localStorage availability
 */
export const useStorageAvailable = () => {
  const [isAvailable, setIsAvailable] = useState(() => {
    try {
      const test = '__storage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  });

  return isAvailable;
};
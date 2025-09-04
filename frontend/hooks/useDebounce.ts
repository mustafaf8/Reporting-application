import { useEffect, useState } from "react";

// Basit debounce hook'u: value değeri değiştikten sonra belirtilen süre bekler ve öyle döner
export default function useDebounce<T>(value: T, delayMs: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timerId);
  }, [value, delayMs]);

  return debouncedValue;
}

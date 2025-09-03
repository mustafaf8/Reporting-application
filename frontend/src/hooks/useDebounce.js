import { useEffect, useState } from "react";

// Basit debounce hook'u: value değeri değiştikten sonra belirtilen süre bekler ve öyle döner
export default function useDebounce(value, delayMs = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timerId);
  }, [value, delayMs]);

  return debouncedValue;
}

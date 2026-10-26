import { useEffect, useRef } from "react";

export function useDebouncedCallback<Value>(callback: (value: Value) => void, delay: number): (value: Value) => void {
    const timer = useRef<number | undefined>(undefined);
    const latest = useRef(callback);
    latest.current = callback;

    useEffect(() => () => window.clearTimeout(timer.current), []);

    return (value: Value) => {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => latest.current(value), delay);
    };
}

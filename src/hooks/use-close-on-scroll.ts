import { useEffect } from "react";

export function useCloseOnScroll(open: boolean, setOpen: (open: boolean) => void): void {
    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        window.addEventListener("scroll", close, { passive: true });
        return () => window.removeEventListener("scroll", close);
    }, [open, setOpen]);
}

import { useSyncExternalStore } from "react";
import * as z from "zod/mini";
import { comparisonLimits } from "@/domain/comparison/selection";
import { slugSchema } from "@/lib/validation/snapshot";

const storageKey = "exoscope:comparaison";
const changeEvent = "exoscope:comparaison";
const emptyList: readonly string[] = [];
const storedListSchema = z.array(slugSchema).check(z.maxLength(comparisonLimits.max));

let cachedRaw: string | null | undefined;
let cachedList: readonly string[] = emptyList;

function readRaw(): string | null {
    try {
        return localStorage.getItem(storageKey);
    } catch {
        return null;
    }
}

export function parseStoredList(raw: string | null): readonly string[] {
    if (!raw) return emptyList;
    try {
        const result = storedListSchema.safeParse(JSON.parse(raw));
        return result.success ? [...new Set(result.data)] : emptyList;
    } catch {
        return emptyList;
    }
}

function getSnapshot(): readonly string[] {
    const raw = readRaw();
    if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedList = parseStoredList(raw);
    }
    return cachedList;
}

function subscribe(listener: () => void): () => void {
    const onStorage = (event: StorageEvent) => {
        if (event.key === storageKey || event.key === null) listener();
    };
    window.addEventListener(changeEvent, listener);
    window.addEventListener("storage", onStorage);
    return () => {
        window.removeEventListener(changeEvent, listener);
        window.removeEventListener("storage", onStorage);
    };
}

export function saveComparisonList(slugs: readonly string[]): void {
    try {
        localStorage.setItem(storageKey, JSON.stringify(slugs.slice(0, comparisonLimits.max)));
    } catch {
        return;
    }
    window.dispatchEvent(new Event(changeEvent));
}

export function useComparisonList(): readonly string[] {
    return useSyncExternalStore(subscribe, getSnapshot, () => emptyList);
}

import { useEffect, useState } from "react";
import { endpoints } from "@/data/site";
import type { ExoplanetReference } from "@/domain/exoplanets/model";
import { fetchValidated, searchResponseSchema } from "@/lib/validation/api";
import { searchTextSchema } from "@/lib/validation/text";

export type SearchStatus = "idle" | "loading" | "success" | "error";

export const searchDelay = 250;

export function usePlanetSearch(query: string) {
    const [results, setResults] = useState<readonly ExoplanetReference[]>([]);
    const [status, setStatus] = useState<SearchStatus>("idle");

    useEffect(() => {
        const search = searchTextSchema.safeParse(query);
        if (!search.success) {
            setResults([]);
            setStatus("idle");
            return;
        }

        const controller = new AbortController();
        setStatus("loading");
        const timer = window.setTimeout(async () => {
            try {
                const url = `${endpoints.search}?${new URLSearchParams({ q: search.data })}`;
                const response = await fetchValidated(url, searchResponseSchema, controller.signal);
                setResults(response.results);
                setStatus("success");
            } catch {
                if (controller.signal.aborted) return;
                setResults([]);
                setStatus("error");
            }
        }, searchDelay);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    return { results, status };
}

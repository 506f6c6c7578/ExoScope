import { useEffect, useRef, useState } from "react";
import { endpoints } from "@/data/site";
import type { ExoplanetSummary } from "@/domain/exoplanets/model";
import type { Page } from "@/domain/filters/pagination";
import { type CatalogQuery, serializeCatalogQuery } from "@/domain/filters/query";
import { catalogPageSchema, fetchValidated } from "@/lib/validation/api";

export type ResultsStatus = "ready" | "loading" | "error";

export function useCatalogueResults(query: CatalogQuery, initialPage: Page<ExoplanetSummary>) {
    const [page, setPage] = useState(initialPage);
    const [status, setStatus] = useState<ResultsStatus>("ready");
    const [attempt, setAttempt] = useState(0);
    const loadedSearch = useRef(serializeCatalogQuery(query).toString());

    useEffect(() => {
        const search = serializeCatalogQuery(query).toString();
        if (search === loadedSearch.current && attempt === 0) return;

        const controller = new AbortController();
        setStatus("loading");
        fetchValidated(`${endpoints.exoplanets}?${search}`, catalogPageSchema, controller.signal).then(
            (result) => {
                loadedSearch.current = search;
                setPage(result);
                setStatus("ready");
            },
            () => {
                if (!controller.signal.aborted) setStatus("error");
            }
        );
        return () => controller.abort();
    }, [query, attempt]);

    return { page, status, retry: () => setAttempt((current) => current + 1) };
}

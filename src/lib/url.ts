import { endpoints, pages } from "@/data/site";
import { comparisonParameter, serializeComparison } from "@/domain/comparison/selection";
import { type CatalogQuery, defaultCatalogQuery, serializeCatalogQuery } from "@/domain/filters/query";

function withSearch(path: string, parameters: URLSearchParams): string {
    const search = parameters.toString();
    return search ? `${path}?${search}` : path;
}

export function getCatalogueUrl(query: Partial<CatalogQuery> = {}): string {
    return withSearch(pages.catalogue, serializeCatalogQuery({ ...defaultCatalogQuery, ...query }));
}

function comparisonParameters(slugs: readonly string[]): URLSearchParams {
    const parameters = new URLSearchParams();
    if (slugs.length > 0) parameters.set(comparisonParameter, serializeComparison(slugs));
    return parameters;
}

export function getComparisonUrl(slugs: readonly string[]): string {
    return withSearch(pages.compare, comparisonParameters(slugs));
}

export function getComparisonApiUrl(slugs: readonly string[]): string {
    return withSearch(endpoints.compare, comparisonParameters(slugs));
}

import type { APIRoute } from "astro";
import { catalog } from "@/data/catalog";
import { runCatalogQuery } from "@/domain/filters/filter";
import { parseCatalogQuery } from "@/domain/filters/query";
import { cachePolicies } from "@/lib/cache/policies";
import { errorResponse, jsonResponse, methodNotAllowed } from "@/lib/http";

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
    const result = parseCatalogQuery(url.searchParams);
    if (!result.success) return errorResponse(400, result.error);
    return jsonResponse(runCatalogQuery(catalog.entries, result.query), cachePolicies.listing);
};

export const HEAD = GET;

export const ALL = methodNotAllowed;

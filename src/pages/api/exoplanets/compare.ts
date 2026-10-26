import type { APIRoute } from "astro";
import { catalog } from "@/data/catalog";
import { comparisonParameter, parseComparisonSlugs } from "@/domain/comparison/selection";
import { cachePolicies } from "@/lib/cache/policies";
import { errorResponse, jsonResponse, methodNotAllowed } from "@/lib/http";

export const prerender = false;

export const GET: APIRoute = ({ url }) => {
    const selection = parseComparisonSlugs(url.searchParams.get(comparisonParameter));
    if (!selection.success) return errorResponse(400, selection.error);
    if (selection.slugs.length === 0) return errorResponse(400, "Indique au moins une planète à comparer.");

    const planets = catalog.findAll(selection.slugs);
    const missing = selection.slugs.filter((slug) => !catalog.findBySlug(slug));
    return jsonResponse({ planets, missing }, cachePolicies.listing);
};

export const HEAD = GET;

export const ALL = methodNotAllowed;

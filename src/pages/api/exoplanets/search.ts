import type { APIRoute } from "astro";
import * as z from "zod/mini";
import { catalog } from "@/data/catalog";
import { toReference } from "@/domain/exoplanets/model";
import { searchPlanets, searchResultLimits } from "@/domain/exoplanets/search";
import { cachePolicies } from "@/lib/cache/policies";
import { errorResponse, jsonResponse, methodNotAllowed } from "@/lib/http";
import { searchTextSchema } from "@/lib/validation/text";

export const prerender = false;

const searchQuerySchema = z.object({
    q: searchTextSchema,
    limite: z.optional(z.pipe(
        z.pipe(z.string().check(z.regex(/^\d{1,2}$/, { error: "Limite invalide." })), z.transform(Number)),
        z.number().check(z.gte(1), z.lte(searchResultLimits.max, { error: "Limite trop élevée." }))
    ))
});

export const GET: APIRoute = ({ url }) => {
    const query = searchQuerySchema.safeParse({
        q: url.searchParams.get("q") ?? "",
        limite: url.searchParams.get("limite") ?? undefined
    });
    if (!query.success) return errorResponse(400, query.error.issues[0]?.message ?? "Recherche invalide.");

    const { q, limite = searchResultLimits.default } = query.data;
    const results = searchPlanets(catalog.entries, q, limite).map(toReference);
    return jsonResponse({ results }, cachePolicies.listing);
};

export const HEAD = GET;

export const ALL = methodNotAllowed;

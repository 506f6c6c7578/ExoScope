import type { APIRoute } from "astro";
import { catalog } from "@/data/catalog";
import { isSlug } from "@/domain/exoplanets/text";
import { cachePolicies } from "@/lib/cache/policies";
import { errorResponse, jsonResponse, methodNotAllowed } from "@/lib/http";

export const prerender = false;

export const GET: APIRoute = ({ params }) => {
    const slug = params.slug ?? "";
    if (!isSlug(slug)) return errorResponse(400, "Identifiant de planète invalide.");
    const planet = catalog.findBySlug(slug);
    if (!planet) return errorResponse(404, "Planète introuvable.");
    return jsonResponse({ planet }, cachePolicies.planet);
};

export const HEAD = GET;

export const ALL = methodNotAllowed;

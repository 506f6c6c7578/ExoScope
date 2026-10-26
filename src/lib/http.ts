import type { APIRoute } from "astro";
import { cachePolicies, type CachePolicy } from "@/lib/cache/policies";

export function jsonResponse(body: unknown, cacheControl: CachePolicy, status = 200): Response {
    return Response.json(body, {
        status,
        headers: { "Cache-Control": cacheControl, "X-Content-Type-Options": "nosniff" }
    });
}

export function errorResponse(status: number, message: string): Response {
    return jsonResponse({ error: message }, cachePolicies.noStore, status);
}

export const methodNotAllowed: APIRoute = () => {
    const response = errorResponse(405, "Méthode non autorisée.");
    response.headers.set("Allow", "GET, HEAD");
    return response;
};

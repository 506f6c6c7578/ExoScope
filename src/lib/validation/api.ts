import * as z from "zod/mini";
import { comparisonLimits } from "@/domain/comparison/selection";
import type { Exoplanet, ExoplanetReference, ExoplanetSummary } from "@/domain/exoplanets/model";
import { searchResultLimits } from "@/domain/exoplanets/search";
import type { Page } from "@/domain/filters/pagination";
import { exoplanetSchema } from "@/lib/validation/snapshot";

export const summarySchema: z.ZodMiniType<ExoplanetSummary> = z.pick(exoplanetSchema, {
    slug: true,
    name: true,
    hostStarName: true,
    discoveryYear: true,
    discoveryMethod: true,
    distanceParsecs: true,
    massJupiter: true,
    radiusJupiter: true,
    orbitalPeriodDays: true,
    equilibriumTemperatureKelvin: true,
    systemPlanetCount: true,
    provenance: true
});

export const referenceSchema: z.ZodMiniType<ExoplanetReference> = z.pick(exoplanetSchema, {
    slug: true,
    name: true,
    hostStarName: true,
    discoveryYear: true,
    discoveryMethod: true
});

const countSchema = z.int().check(z.gte(0));

export const catalogPageSchema: z.ZodMiniType<Page<ExoplanetSummary>> = z.object({
    items: z.array(summarySchema).check(z.maxLength(50)),
    page: countSchema,
    pageSize: countSchema,
    total: countSchema,
    totalPages: countSchema
});

export interface SearchResponse {
    results: ExoplanetReference[];
}

export const searchResponseSchema: z.ZodMiniType<SearchResponse> = z.object({
    results: z.array(referenceSchema).check(z.maxLength(searchResultLimits.max))
});

export interface ComparisonResponse {
    planets: Exoplanet[];
    missing: string[];
}

export const comparisonResponseSchema: z.ZodMiniType<ComparisonResponse> = z.object({
    planets: z.array(exoplanetSchema).check(z.maxLength(comparisonLimits.max)),
    missing: z.array(z.string()).check(z.maxLength(comparisonLimits.max))
});

export async function fetchValidated<Output>(url: string, schema: z.ZodMiniType<Output>, signal: AbortSignal): Promise<Output> {
    const response = await fetch(url, { headers: { Accept: "application/json" }, signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data: unknown = await response.json();
    return schema.parse(data);
}

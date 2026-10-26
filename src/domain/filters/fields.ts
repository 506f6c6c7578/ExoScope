import { type SummaryPropertyKey, summaryProperties } from "@/domain/exoplanets/properties";

export type RangeScale = "linear" | "log";

interface RangeFilterDefinition {
    property: SummaryPropertyKey;
    scale: RangeScale;
}

export const rangeFilters = {
    annee: { property: "discoveryYear", scale: "linear" },
    distance: { property: "distance", scale: "log" },
    masse: { property: "mass", scale: "log" },
    rayon: { property: "radius", scale: "log" },
    periode: { property: "orbitalPeriod", scale: "log" },
    temperature: { property: "equilibriumTemperature", scale: "log" },
    planetes: { property: "systemPlanetCount", scale: "linear" }
} as const satisfies Record<string, RangeFilterDefinition>;

export type RangeFilterKey = keyof typeof rangeFilters;

export const rangeFilterKeys = Object.keys(rangeFilters) as RangeFilterKey[];

export const sortKeys = ["nom", ...rangeFilterKeys] as const;

export type SortKey = (typeof sortKeys)[number];

export const sortOrders = ["asc", "desc"] as const;

export type SortOrder = (typeof sortOrders)[number];

export function getRangeProperty(key: RangeFilterKey) {
    return summaryProperties[rangeFilters[key].property];
}

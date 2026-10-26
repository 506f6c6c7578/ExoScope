import type { ConstellationCode } from "@/data/constellations";

export const discoveryMethods = [
    "transit",
    "vitesse-radiale",
    "imagerie-directe",
    "microlentille",
    "astrometrie",
    "variation-temps-transit",
    "variation-temps-eclipse",
    "chronometrie-pulsar",
    "variation-pulsation",
    "modulation-luminosite",
    "cinematique-disque"
] as const;

export type DiscoveryMethod = (typeof discoveryMethods)[number];

export const valueOrigins = [
    "minimum",
    "estimated",
    "calculated",
    "upper-limit",
    "lower-limit"
] as const;

export type ValueOrigin = (typeof valueOrigins)[number];

export const qualifiedQuantities = [
    "mass",
    "radius",
    "orbitalPeriod",
    "semiMajorAxis",
    "eccentricity",
    "equilibriumTemperature"
] as const;

export type QualifiedQuantity = (typeof qualifiedQuantities)[number];

export type Provenance = Partial<Record<QualifiedQuantity, ValueOrigin>>;

export interface Exoplanet {
    slug: string;
    name: string;
    hostStarName: string | null;
    discoveryYear: number | null;
    discoveryMethod: DiscoveryMethod | null;
    discoveryFacility: string | null;
    distanceParsecs: number | null;
    massJupiter: number | null;
    radiusJupiter: number | null;
    orbitalPeriodDays: number | null;
    semiMajorAxisAu: number | null;
    eccentricity: number | null;
    equilibriumTemperatureKelvin: number | null;
    stellarEffectiveTemperatureKelvin: number | null;
    stellarRadiusSolar: number | null;
    systemPlanetCount: number | null;
    constellation: ConstellationCode | null;
    controversial: boolean;
    provenance: Provenance;
}

export type ExoplanetSummary = Pick<
    Exoplanet,
    | "slug"
    | "name"
    | "hostStarName"
    | "discoveryYear"
    | "discoveryMethod"
    | "distanceParsecs"
    | "massJupiter"
    | "radiusJupiter"
    | "orbitalPeriodDays"
    | "equilibriumTemperatureKelvin"
    | "systemPlanetCount"
    | "provenance"
>;

export type ExoplanetReference = Pick<Exoplanet, "slug" | "name" | "hostStarName" | "discoveryYear" | "discoveryMethod">;

export interface CatalogSource {
    name: string;
    table: string;
    url: string;
}

export interface CatalogSnapshot {
    schemaVersion: 1;
    source: CatalogSource;
    retrievedAt: string;
    planets: Exoplanet[];
}

export function getOrigin(planet: Pick<Exoplanet, "provenance">, quantity: QualifiedQuantity): ValueOrigin | null {
    return planet.provenance[quantity] ?? null;
}

export function toSummary({
    slug,
    name,
    hostStarName,
    discoveryYear,
    discoveryMethod,
    distanceParsecs,
    massJupiter,
    radiusJupiter,
    orbitalPeriodDays,
    equilibriumTemperatureKelvin,
    systemPlanetCount,
    provenance
}: Exoplanet): ExoplanetSummary {
    return {
        slug,
        name,
        hostStarName,
        discoveryYear,
        discoveryMethod,
        distanceParsecs,
        massJupiter,
        radiusJupiter,
        orbitalPeriodDays,
        equilibriumTemperatureKelvin,
        systemPlanetCount,
        provenance
    };
}

export function toReference({ slug, name, hostStarName, discoveryYear, discoveryMethod }: ExoplanetReference): ExoplanetReference {
    return { slug, name, hostStarName, discoveryYear, discoveryMethod };
}

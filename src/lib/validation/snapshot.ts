import * as z from "zod/mini";
import { type ConstellationCode, isConstellationCode } from "@/data/constellations";
import {
    type CatalogSnapshot,
    discoveryMethods,
    type Exoplanet,
    qualifiedQuantities,
    valueOrigins
} from "@/domain/exoplanets/model";
import { isSlug } from "@/domain/exoplanets/text";
import { printableTextSchema } from "@/lib/validation/text";

export const snapshotLimits = {
    maxPlanets: 20_000,
    maxBytes: 8 * 1024 * 1024
} as const;

const positiveNumber = z.number().check(z.gt(0));
const nullablePositive = z.nullable(positiveNumber);

export const slugSchema = z.string().check(z.refine(isSlug, { error: "Identifiant invalide." }));

const constellationSchema = z.custom<ConstellationCode>(
    (value) => typeof value === "string" && isConstellationCode(value),
    { error: "Constellation inconnue." }
);

export const provenanceSchema = z.partialRecord(z.enum(qualifiedQuantities), z.enum(valueOrigins));

export const exoplanetSchema = z.strictObject({
    slug: slugSchema,
    name: printableTextSchema(120),
    hostStarName: z.nullable(printableTextSchema(120)),
    discoveryYear: z.nullable(z.int().check(z.gte(1900), z.lte(2200))),
    discoveryMethod: z.nullable(z.enum(discoveryMethods)),
    discoveryFacility: z.nullable(printableTextSchema(160)),
    distanceParsecs: nullablePositive,
    massJupiter: nullablePositive,
    radiusJupiter: nullablePositive,
    orbitalPeriodDays: nullablePositive,
    semiMajorAxisAu: nullablePositive,
    eccentricity: z.nullable(z.number().check(z.gte(0), z.lt(1))),
    equilibriumTemperatureKelvin: nullablePositive,
    stellarEffectiveTemperatureKelvin: nullablePositive,
    stellarRadiusSolar: nullablePositive,
    systemPlanetCount: z.nullable(z.int().check(z.gte(1), z.lte(100))),
    constellation: z.nullable(constellationSchema),
    controversial: z.boolean(),
    provenance: provenanceSchema
});

function hasUniqueSlugs(planets: readonly Exoplanet[]): boolean {
    return new Set(planets.map(({ slug }) => slug)).size === planets.length;
}

export const snapshotSchema: z.ZodMiniType<CatalogSnapshot> = z.strictObject({
    schemaVersion: z.literal(1),
    source: z.strictObject({
        name: printableTextSchema(120),
        table: printableTextSchema(60),
        url: z.httpUrl()
    }),
    retrievedAt: z.iso.datetime(),
    planets: z.array(exoplanetSchema).check(
        z.minLength(1),
        z.maxLength(snapshotLimits.maxPlanets),
        z.refine(hasUniqueSlugs, { error: "Identifiants de planètes en double." })
    )
});

export function parseSnapshot(serialized: string): CatalogSnapshot {
    if (serialized.length > snapshotLimits.maxBytes) throw new Error("Le snapshot dépasse la taille autorisée.");
    const data: unknown = JSON.parse(serialized);
    return snapshotSchema.parse(data);
}

export function serializeSnapshot({ planets, ...metadata }: CatalogSnapshot): string {
    const header = JSON.stringify(metadata).slice(0, -1);
    return `${header},"planets":[\n${planets.map((planet) => JSON.stringify(planet)).join(",\n")}\n]}\n`;
}

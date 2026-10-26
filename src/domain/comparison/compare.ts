import { computeDensity } from "@/domain/exoplanets/density";
import { type Exoplanet, getOrigin, type ValueOrigin } from "@/domain/exoplanets/model";
import { type PlanetPropertyKey, planetProperties, type QuantityFormat } from "@/domain/exoplanets/properties";

export type Extreme = "highest" | "lowest";

export interface ComparisonCell {
    slug: string;
    value: number | null;
    origin: ValueOrigin | null;
    extreme: Extreme | null;
}

export interface ComparisonRow {
    key: PlanetPropertyKey | "density";
    label: string;
    unit: string | null;
    unitName: string | null;
    format: QuantityFormat;
    cells: ComparisonCell[];
}

export const comparedRows = [
    "mass",
    "radius",
    "density",
    "orbitalPeriod",
    "semiMajorAxis",
    "eccentricity",
    "equilibriumTemperature",
    "distance",
    "stellarTemperature",
    "stellarRadius",
    "systemPlanetCount",
    "discoveryYear"
] as const satisfies readonly ComparisonRow["key"][];

function markExtremes(cells: Omit<ComparisonCell, "extreme">[]): ComparisonCell[] {
    const values = cells.flatMap(({ value }) => (value === null ? [] : [value]));
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    const comparable = values.length >= 2 && highest !== lowest;
    const getExtreme = (value: number | null): Extreme | null => {
        if (!comparable || value === null) return null;
        if (value === highest) return "highest";
        return value === lowest ? "lowest" : null;
    };
    return cells.map((cell) => ({ ...cell, extreme: getExtreme(cell.value) }));
}

function densityRow(planets: readonly Exoplanet[]): ComparisonRow {
    return {
        key: "density",
        label: "Densité",
        unit: "g/cm³",
        unitName: "grammes par centimètre cube",
        format: "significant",
        cells: markExtremes(planets.map((planet) => {
            const density = computeDensity(planet);
            return {
                slug: planet.slug,
                value: density?.gramsPerCubicCentimeter ?? null,
                origin: density?.isMinimum ? "minimum" : density ? "calculated" : null
            };
        }))
    };
}

function propertyRow(key: PlanetPropertyKey, planets: readonly Exoplanet[]): ComparisonRow {
    const { label, unit, unitName, format, quantity, read } = planetProperties[key];
    return {
        key,
        label,
        unit,
        unitName,
        format,
        cells: markExtremes(planets.map((planet) => ({
            slug: planet.slug,
            value: read(planet),
            origin: quantity ? getOrigin(planet, quantity) : null
        })))
    };
}

export function buildComparisonRows(planets: readonly Exoplanet[]): ComparisonRow[] {
    return comparedRows.map((key) => (key === "density" ? densityRow(planets) : propertyRow(key, planets)));
}

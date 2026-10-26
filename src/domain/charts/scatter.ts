import { solarSystemPlanets } from "@/data/solar-system";
import type { Exoplanet } from "@/domain/exoplanets/model";
import { summaryProperties } from "@/domain/exoplanets/properties";
import { hasMeasuredMassAndRadius } from "@/domain/filters/filter";

export type ScatterPoint = readonly [x: number, y: number];

export interface LabelledPoint {
    name: string;
    x: number;
    y: number;
}

export type ScatterKind = "massRadius" | "orbit";

interface ScatterDefinition {
    x: (planet: Exoplanet) => number | null;
    y: (planet: Exoplanet) => number | null;
    include: (planet: Exoplanet) => boolean;
    reference: (body: (typeof solarSystemPlanets)[keyof typeof solarSystemPlanets]) => ScatterPoint;
}

export const scatterDefinitions: Record<ScatterKind, ScatterDefinition> = {
    massRadius: {
        x: summaryProperties.mass.read,
        y: summaryProperties.radius.read,
        include: hasMeasuredMassAndRadius,
        reference: (body) => [body.massEarth, body.radiusEarth]
    },
    orbit: {
        x: summaryProperties.orbitalPeriod.read,
        y: (planet) => planet.semiMajorAxisAu,
        include: (planet) => planet.provenance.orbitalPeriod === undefined && planet.provenance.semiMajorAxis === undefined,
        reference: (body) => [body.orbitalPeriodDays, body.semiMajorAxisAu]
    }
};

export const scatterSampleLimit = 600;

function roundToSignificant(value: number): number {
    return Number(value.toPrecision(3));
}

export function toScatterPoint(planet: Exoplanet, kind: ScatterKind): ScatterPoint | null {
    const { x, y } = scatterDefinitions[kind];
    const xValue = x(planet);
    const yValue = y(planet);
    return xValue === null || yValue === null ? null : [roundToSignificant(xValue), roundToSignificant(yValue)];
}

export function sampleScatter(planets: readonly Exoplanet[], kind: ScatterKind, limit = scatterSampleLimit): ScatterPoint[] {
    const { include } = scatterDefinitions[kind];
    const points = planets.flatMap((planet) => {
        const point = include(planet) ? toScatterPoint(planet, kind) : null;
        return point ? [point] : [];
    });
    if (points.length <= limit) return points;
    const step = points.length / limit;
    return Array.from({ length: limit }, (_, index) => points[Math.floor(index * step)])
        .filter((point): point is ScatterPoint => point !== undefined);
}

export function getReferencePoints(kind: ScatterKind): LabelledPoint[] {
    return Object.values(solarSystemPlanets).map((body) => {
        const [x, y] = scatterDefinitions[kind].reference(body);
        return { name: body.name, x, y };
    });
}

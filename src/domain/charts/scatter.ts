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

export interface SelectionPoint extends LabelledPoint {
    marker: string;
}

export type LabelSide = "top" | "right" | "bottom" | "left";

export interface ReferencePoint extends LabelledPoint {
    labelSide: LabelSide;
}

export type ScatterKind = "massRadius" | "orbit";

type SolarSystemBody = keyof typeof solarSystemPlanets;

interface ScatterDefinition {
    x: (planet: Exoplanet) => number | null;
    y: (planet: Exoplanet) => number | null;
    include: (planet: Exoplanet) => boolean;
    reference: (body: (typeof solarSystemPlanets)[SolarSystemBody]) => ScatterPoint;
    labelSides: Partial<Record<SolarSystemBody, LabelSide>>;
}

export const scatterDefinitions: Record<ScatterKind, ScatterDefinition> = {
    massRadius: {
        x: summaryProperties.mass.read,
        y: summaryProperties.radius.read,
        include: hasMeasuredMassAndRadius,
        reference: (body) => [body.massEarth, body.radiusEarth],
        labelSides: { venus: "bottom", uranus: "left" }
    },
    orbit: {
        x: summaryProperties.orbitalPeriod.read,
        y: (planet) => planet.semiMajorAxisAu,
        include: (planet) => planet.provenance.orbitalPeriod === undefined && planet.provenance.semiMajorAxis === undefined,
        reference: (body) => [body.orbitalPeriodDays, body.semiMajorAxisAu],
        labelSides: {}
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

export function getReferencePoints(kind: ScatterKind): ReferencePoint[] {
    const { reference, labelSides } = scatterDefinitions[kind];
    return (Object.entries(solarSystemPlanets) as [SolarSystemBody, (typeof solarSystemPlanets)[SolarSystemBody]][]).map(([key, body]) => {
        const [x, y] = reference(body);
        return { name: body.name, x, y, labelSide: labelSides[key] ?? "right" };
    });
}

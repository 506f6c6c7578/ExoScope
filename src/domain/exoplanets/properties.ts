import type { Exoplanet, ExoplanetSummary, QualifiedQuantity } from "@/domain/exoplanets/model";
import { jupiterToEarthMasses, jupiterToEarthRadii, mapKnown, parsecsToLightYears } from "@/domain/units/conversions";

export type QuantityFormat = "year" | "integer" | "significant" | "ratio";

export interface PlanetProperty<Planet> {
    label: string;
    unit: string | null;
    unitName: string | null;
    format: QuantityFormat;
    quantity: QualifiedQuantity | null;
    read: (planet: Planet) => number | null;
}

export const summaryProperties = {
    discoveryYear: {
        label: "Année de découverte",
        unit: null,
        unitName: null,
        format: "year",
        quantity: null,
        read: (planet) => planet.discoveryYear
    },
    orbitalPeriod: {
        label: "Période orbitale",
        unit: "j",
        unitName: "jours",
        format: "significant",
        quantity: "orbitalPeriod",
        read: (planet) => planet.orbitalPeriodDays
    },
    mass: {
        label: "Masse",
        unit: "M⊕",
        unitName: "masses terrestres",
        format: "significant",
        quantity: "mass",
        read: (planet) => mapKnown(planet.massJupiter, jupiterToEarthMasses)
    },
    radius: {
        label: "Rayon",
        unit: "R⊕",
        unitName: "rayons terrestres",
        format: "significant",
        quantity: "radius",
        read: (planet) => mapKnown(planet.radiusJupiter, jupiterToEarthRadii)
    },
    distance: {
        label: "Distance",
        unit: "al",
        unitName: "années-lumière",
        format: "significant",
        quantity: null,
        read: (planet) => mapKnown(planet.distanceParsecs, parsecsToLightYears)
    },
    equilibriumTemperature: {
        label: "Température d'équilibre",
        unit: "K",
        unitName: "kelvins",
        format: "integer",
        quantity: "equilibriumTemperature",
        read: (planet) => planet.equilibriumTemperatureKelvin
    },
    systemPlanetCount: {
        label: "Planètes du système",
        unit: null,
        unitName: null,
        format: "integer",
        quantity: null,
        read: (planet) => planet.systemPlanetCount
    }
} as const satisfies Record<string, PlanetProperty<ExoplanetSummary>>;

export const planetProperties = {
    ...summaryProperties,
    massJupiter: {
        label: "Masse",
        unit: "MJ",
        unitName: "masses joviennes",
        format: "significant",
        quantity: "mass",
        read: (planet) => planet.massJupiter
    },
    radiusJupiter: {
        label: "Rayon",
        unit: "RJ",
        unitName: "rayons joviens",
        format: "significant",
        quantity: "radius",
        read: (planet) => planet.radiusJupiter
    },
    distanceParsecs: {
        label: "Distance",
        unit: "pc",
        unitName: "parsecs",
        format: "significant",
        quantity: null,
        read: (planet) => planet.distanceParsecs
    },
    semiMajorAxis: {
        label: "Demi-grand axe",
        unit: "ua",
        unitName: "unités astronomiques",
        format: "significant",
        quantity: "semiMajorAxis",
        read: (planet) => planet.semiMajorAxisAu
    },
    eccentricity: {
        label: "Excentricité",
        unit: null,
        unitName: null,
        format: "ratio",
        quantity: "eccentricity",
        read: (planet) => planet.eccentricity
    },
    stellarTemperature: {
        label: "Température effective de l'étoile",
        unit: "K",
        unitName: "kelvins",
        format: "integer",
        quantity: null,
        read: (planet) => planet.stellarEffectiveTemperatureKelvin
    },
    stellarRadius: {
        label: "Rayon de l'étoile",
        unit: "R☉",
        unitName: "rayons solaires",
        format: "significant",
        quantity: null,
        read: (planet) => planet.stellarRadiusSolar
    }
} as const satisfies Record<string, PlanetProperty<Exoplanet>>;

export type SummaryPropertyKey = keyof typeof summaryProperties;
export type PlanetPropertyKey = keyof typeof planetProperties;

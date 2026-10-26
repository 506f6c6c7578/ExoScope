export interface ReferencePlanet {
    name: string;
    massEarth: number;
    radiusEarth: number;
    orbitalPeriodDays: number;
    semiMajorAxisAu: number;
}

export const solarSystemPlanets = {
    mercury: { name: "Mercure", massEarth: 0.0553, radiusEarth: 0.383, orbitalPeriodDays: 88, semiMajorAxisAu: 0.387 },
    venus: { name: "Vénus", massEarth: 0.815, radiusEarth: 0.949, orbitalPeriodDays: 224.7, semiMajorAxisAu: 0.723 },
    earth: { name: "Terre", massEarth: 1, radiusEarth: 1, orbitalPeriodDays: 365.25, semiMajorAxisAu: 1 },
    mars: { name: "Mars", massEarth: 0.107, radiusEarth: 0.532, orbitalPeriodDays: 687, semiMajorAxisAu: 1.524 },
    jupiter: { name: "Jupiter", massEarth: 317.8, radiusEarth: 11.21, orbitalPeriodDays: 4_331, semiMajorAxisAu: 5.203 },
    saturn: { name: "Saturne", massEarth: 95.2, radiusEarth: 9.45, orbitalPeriodDays: 10_747, semiMajorAxisAu: 9.537 },
    uranus: { name: "Uranus", massEarth: 14.5, radiusEarth: 4.01, orbitalPeriodDays: 30_589, semiMajorAxisAu: 19.19 },
    neptune: { name: "Neptune", massEarth: 17.1, radiusEarth: 3.88, orbitalPeriodDays: 59_800, semiMajorAxisAu: 30.07 }
} as const satisfies Record<string, ReferencePlanet>;

export const comparisonReferences = [solarSystemPlanets.earth, solarSystemPlanets.neptune, solarSystemPlanets.jupiter] as const;

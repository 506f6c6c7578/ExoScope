import { type IndexedPlanet, nameCollator } from "@/domain/exoplanets/catalog";
import type { Exoplanet } from "@/domain/exoplanets/model";
import { summaryProperties } from "@/domain/exoplanets/properties";

type Reader = (planet: Exoplanet) => number | null;

const similarityAxes: readonly (readonly [Reader, Reader])[] = [
    [summaryProperties.radius.read, summaryProperties.orbitalPeriod.read],
    [summaryProperties.mass.read, summaryProperties.orbitalPeriod.read]
];

function logDistance(first: number, second: number): number {
    return Math.log10(first) - Math.log10(second);
}

export function findSimilarPlanets(entries: readonly IndexedPlanet[], planet: Exoplanet, limit: number): Exoplanet[] {
    for (const [readSize, readOrbit] of similarityAxes) {
        const size = readSize(planet);
        const orbit = readOrbit(planet);
        if (size === null || orbit === null) continue;

        return entries
            .flatMap(({ planet: candidate }) => {
                const candidateSize = readSize(candidate);
                const candidateOrbit = readOrbit(candidate);
                if (candidate.hostStarName === planet.hostStarName || candidateSize === null || candidateOrbit === null) return [];
                return [{ candidate, distance: Math.hypot(logDistance(candidateSize, size), logDistance(candidateOrbit, orbit)) }];
            })
            .sort((first, second) => first.distance - second.distance ||
                nameCollator.compare(first.candidate.name, second.candidate.name))
            .slice(0, limit)
            .map(({ candidate }) => candidate);
    }
    return [];
}

import { type IndexedPlanet, nameCollator } from "@/domain/exoplanets/catalog";
import type { Exoplanet } from "@/domain/exoplanets/model";
import { toSearchKey } from "@/domain/exoplanets/text";

export const searchResultLimits = { default: 8, max: 20 } as const;

function getRank({ nameKey, hostKey }: IndexedPlanet, key: string): number | null {
    if (nameKey === key) return 0;
    if (nameKey.startsWith(key)) return 1;
    if (hostKey === key) return 2;
    if (hostKey.startsWith(key)) return 3;
    if (nameKey.includes(key)) return 4;
    if (hostKey.includes(key)) return 5;
    return null;
}

export function searchPlanets(entries: readonly IndexedPlanet[], text: string, limit: number): Exoplanet[] {
    const key = toSearchKey(text);
    if (key === "") return [];
    return entries
        .flatMap((entry) => {
            const rank = getRank(entry, key);
            return rank === null ? [] : [{ planet: entry.planet, rank }];
        })
        .sort((first, second) => first.rank - second.rank || nameCollator.compare(first.planet.name, second.planet.name))
        .slice(0, limit)
        .map(({ planet }) => planet);
}

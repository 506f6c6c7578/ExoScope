import type { DiscoveryMethod, Exoplanet } from "@/domain/exoplanets/model";

export interface Count<Key> {
    key: Key;
    count: number;
}

export interface CatalogStatistics {
    planetCount: number;
    systemCount: number;
    latestDiscoveryYear: number | null;
    methods: Count<DiscoveryMethod>[];
    discoveriesByYear: Count<number>[];
}

function countBy<Key>(planets: readonly Exoplanet[], read: (planet: Exoplanet) => Key | null): Map<Key, number> {
    const counts = new Map<Key, number>();
    for (const planet of planets) {
        const key = read(planet);
        if (key !== null) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
}

function fillYears(counts: Map<number, number>): Count<number>[] {
    const years = [...counts.keys()];
    if (years.length === 0) return [];
    const first = Math.min(...years);
    return Array.from({ length: Math.max(...years) - first + 1 }, (_, index) => ({
        key: first + index,
        count: counts.get(first + index) ?? 0
    }));
}

export function getCatalogStatistics(planets: readonly Exoplanet[]): CatalogStatistics {
    const years = countBy(planets, (planet) => planet.discoveryYear);
    const methods = [...countBy(planets, (planet) => planet.discoveryMethod)]
        .map(([key, count]) => ({ key, count }))
        .sort((first, second) => second.count - first.count);

    return {
        planetCount: planets.length,
        systemCount: new Set(planets.map((planet) => planet.hostStarName ?? planet.slug)).size,
        latestDiscoveryYear: years.size > 0 ? Math.max(...years.keys()) : null,
        methods,
        discoveriesByYear: fillYears(years)
    };
}

export function countByMethod(statistics: CatalogStatistics, method: DiscoveryMethod): number {
    return statistics.methods.find(({ key }) => key === method)?.count ?? 0;
}

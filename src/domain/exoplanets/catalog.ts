import type { CatalogSnapshot, Exoplanet } from "@/domain/exoplanets/model";
import { toSearchKey } from "@/domain/exoplanets/text";

export interface IndexedPlanet {
    planet: Exoplanet;
    nameKey: string;
    hostKey: string;
}

export interface Catalog {
    snapshot: CatalogSnapshot;
    entries: readonly IndexedPlanet[];
    findBySlug: (slug: string) => Exoplanet | null;
    findAll: (slugs: readonly string[]) => Exoplanet[];
    findSystem: (planet: Exoplanet) => readonly Exoplanet[];
}

export const nameCollator = new Intl.Collator("fr", { numeric: true, sensitivity: "base" });

export function createCatalog(snapshot: CatalogSnapshot): Catalog {
    const entries = snapshot.planets.map((planet) => ({
        planet,
        nameKey: toSearchKey(planet.name),
        hostKey: planet.hostStarName ? toSearchKey(planet.hostStarName) : ""
    }));
    const bySlug = new Map(snapshot.planets.map((planet) => [planet.slug, planet]));
    const byHost = Map.groupBy(snapshot.planets.filter((planet) => planet.hostStarName), (planet) => planet.hostStarName);
    for (const planets of byHost.values()) planets.sort((first, second) => nameCollator.compare(first.name, second.name));

    return {
        snapshot,
        entries,
        findBySlug: (slug) => bySlug.get(slug) ?? null,
        findAll: (slugs) => slugs.flatMap((slug) => bySlug.get(slug) ?? []),
        findSystem: (planet) => byHost.get(planet.hostStarName) ?? [planet]
    };
}

import { type IndexedPlanet, nameCollator } from "@/domain/exoplanets/catalog";
import { type Exoplanet, type ExoplanetSummary, toSummary } from "@/domain/exoplanets/model";
import { toSearchKey } from "@/domain/exoplanets/text";
import { getRangeProperty, type RangeFilterKey, type SortKey, type SortOrder } from "@/domain/filters/fields";
import { type Page, paginate } from "@/domain/filters/pagination";
import type { CatalogQuery, NumericRange } from "@/domain/filters/query";

type Predicate = (entry: IndexedPlanet) => boolean;

export function hasMeasuredMassAndRadius({ massJupiter, radiusJupiter, provenance }: Exoplanet): boolean {
    return massJupiter !== null && radiusJupiter !== null && provenance.mass === undefined && provenance.radius === undefined;
}

function rangePredicate(key: RangeFilterKey, { min, max }: NumericRange): Predicate {
    const { read } = getRangeProperty(key);
    return ({ planet }) => {
        const value = read(planet);
        return value !== null && (min === null || value >= min) && (max === null || value <= max);
    };
}

function buildPredicates(query: CatalogQuery): Predicate[] {
    const predicates: Predicate[] = [];
    const textKey = toSearchKey(query.text);
    const hostKey = toSearchKey(query.host);
    if (textKey) predicates.push(({ nameKey, hostKey: host }) => nameKey.includes(textKey) || host.includes(textKey));
    if (hostKey) predicates.push(({ hostKey: host }) => host.includes(hostKey));
    if (query.methods.length > 0) {
        const methods = new Set(query.methods);
        predicates.push(({ planet }) => planet.discoveryMethod !== null && methods.has(planet.discoveryMethod));
    }
    if (query.measuredOnly) predicates.push(({ planet }) => hasMeasuredMassAndRadius(planet));
    for (const [key, range] of Object.entries(query.ranges) as [RangeFilterKey, NumericRange][]) {
        predicates.push(rangePredicate(key, range));
    }
    return predicates;
}

export function filterCatalog(entries: readonly IndexedPlanet[], query: CatalogQuery): Exoplanet[] {
    const predicates = buildPredicates(query);
    return entries.filter((entry) => predicates.every((predicate) => predicate(entry))).map(({ planet }) => planet);
}

function compareKnown(first: number | null, second: number | null, direction: number): number {
    if (first === null || second === null) return Number(first === null) - Number(second === null);
    return (first - second) * direction;
}

export function sortPlanets(planets: readonly Exoplanet[], sort: SortKey, order: SortOrder): Exoplanet[] {
    const direction = order === "asc" ? 1 : -1;
    const byName = (first: Exoplanet, second: Exoplanet) => nameCollator.compare(first.name, second.name);
    if (sort === "nom") return planets.toSorted((first, second) => byName(first, second) * direction);
    const { read } = getRangeProperty(sort);
    return planets.toSorted((first, second) => compareKnown(read(first), read(second), direction) || byName(first, second));
}

export function runCatalogQuery(entries: readonly IndexedPlanet[], query: CatalogQuery): Page<ExoplanetSummary> {
    const sorted = sortPlanets(filterCatalog(entries, query), query.sort, query.order);
    const page = paginate(sorted, query.page, query.pageSize);
    return { ...page, items: page.items.map(toSummary) };
}

import { describe, expect, it } from "vitest";
import { buildComparisonRows } from "@/domain/comparison/compare";
import { comparisonLimits, parseComparisonSlugs, serializeComparison, toggleSelection } from "@/domain/comparison/selection";
import { filterCatalog, hasMeasuredMassAndRadius, runCatalogQuery, sortPlanets } from "@/domain/filters/filter";
import { getPageLinks, paginate } from "@/domain/filters/pagination";
import {
    type CatalogQuery,
    clearFilters,
    countActiveFilters,
    defaultCatalogQuery,
    formatParameterNumber,
    parseCatalogQuery,
    serializeCatalogQuery,
    withRange
} from "@/domain/filters/query";
import { computeRangeBounds, fromSliderPosition, sliderResolution, toSliderPosition } from "@/domain/filters/scale";
import { earthToJupiterMasses, earthToJupiterRadii } from "@/domain/units/conversions";
import { makeCatalog, makePlanet } from "./fixtures";

function parse(search: string): CatalogQuery {
    const result = parseCatalogQuery(new URLSearchParams(search));
    if (!result.success) throw new Error(result.error);
    return result.query;
}

function parseError(search: string): string | null {
    const result = parseCatalogQuery(new URLSearchParams(search));
    return result.success ? null : result.error;
}

const planets = [
    makePlanet({ name: "Alpha b", discoveryYear: 1995, discoveryMethod: "vitesse-radiale", massJupiter: 0.5, radiusJupiter: null, provenance: { mass: "minimum" } }),
    makePlanet({ name: "Beta b", discoveryYear: 2010, massJupiter: earthToJupiterMasses(1), radiusJupiter: earthToJupiterRadii(1) }),
    makePlanet({ name: "Gamma b", discoveryYear: 2020, massJupiter: earthToJupiterMasses(5), radiusJupiter: earthToJupiterRadii(1.5), provenance: { mass: "estimated" } }),
    makePlanet({ name: "Delta b", discoveryYear: null, discoveryMethod: "imagerie-directe", massJupiter: 10, radiusJupiter: 1.2, distanceParsecs: null, hostStarName: "HR 1" })
];
const catalog = makeCatalog(planets);

describe("paramètres du catalogue", () => {
    it("applique les valeurs par défaut sans paramètre", () => {
        expect(parse("")).toEqual(defaultCatalogQuery);
    });

    it("lit des filtres valides et ignore les paramètres inconnus", () => {
        const query = parse("q=kepler&etoile=Kepler-90&methode=transit,imagerie-directe,transit&masse-min=0.5&masse-max=10&mesurees=1&tri=masse&ordre=asc&page=3&taille=50&utm_source=x");
        expect(query).toEqual({
            text: "kepler",
            host: "Kepler-90",
            methods: ["transit", "imagerie-directe"],
            ranges: { masse: { min: 0.5, max: 10 } },
            measuredOnly: true,
            sort: "masse",
            order: "asc",
            page: 3,
            pageSize: 50
        });
    });

    it("fait l'aller-retour avec l'URL générée", () => {
        const query = parse("q=trappist&methode=transit&rayon-min=0.5&temperature-max=310&tri=nom&ordre=asc&page=2");
        expect(parse(serializeCatalogQuery(query).toString())).toEqual(query);
        expect(serializeCatalogQuery(defaultCatalogQuery).toString()).toBe("");
    });

    it.each([
        ["taille=51", "Taille de page non autorisée."],
        ["taille=1000", "Taille de page invalide."],
        ["page=0", null],
        ["page=1001", "Page trop élevée."],
        ["page=-1", "Page invalide."],
        ["tri=__proto__", "Tri non autorisé."],
        ["ordre=random", "Ordre de tri invalide."],
        ["methode=telepathie", "Méthode de découverte inconnue."],
        ["masse-min=1e3", "Valeur numérique invalide."],
        ["masse-min=-1", "Valeur numérique invalide."],
        ["masse-min=Infinity", "Valeur numérique invalide."],
        ["annee-min=2020&annee-max=2010", "Année de découverte : la valeur minimale dépasse la valeur maximale."],
        ["mesurees=oui", "Valeur invalide pour les données mesurées."],
        [`q=${"a".repeat(101)}`, null],
        ["q=abc%00def", null]
    ])("refuse %s", (search, message) => {
        const error = parseError(search);
        expect(error).not.toBeNull();
        if (message) expect(error).toBe(message);
    });

    it("borne le nombre et la longueur des paramètres", () => {
        const many = Array.from({ length: 40 }, (_, index) => `p${index}=1`).join("&");
        expect(parseError(many)).toBe("La requête contient trop de paramètres.");
        expect(parseError(`q=${"a".repeat(3000)}`)).toBe("La requête contient trop de paramètres.");
    });

    it("conserve la première occurrence d'un paramètre répété", () => {
        expect(parse("tri=nom&tri=masse").sort).toBe("nom");
    });

    it("compte, retire et réinitialise les filtres", () => {
        const query = parse("q=a b&methode=transit&rayon-max=2&tri=nom");
        expect(countActiveFilters(query)).toBe(3);
        expect(withRange(query.ranges, "rayon", undefined)).toEqual({});
        expect(withRange({}, "masse", { min: 1, max: null })).toEqual({ masse: { min: 1, max: null } });
        expect(clearFilters(query)).toEqual({ ...defaultCatalogQuery, sort: "nom", order: "desc" });
    });

    it("sérialise les nombres sans notation exponentielle", () => {
        expect(formatParameterNumber(0.000_002)).toBe("0.000002");
        expect(formatParameterNumber(1_250)).toBe("1250");
        expect(formatParameterNumber(0.25)).toBe("0.25");
    });
});

describe("filtrage et tri", () => {
    const names = (query: string) => filterCatalog(catalog.entries, parse(query)).map(({ name }) => name);

    it("filtre par texte, étoile hôte et méthode", () => {
        expect(names("q=gam")).toEqual(["Gamma b"]);
        expect(names("etoile=hr 1")).toEqual(["Delta b"]);
        expect(names("methode=vitesse-radiale,imagerie-directe")).toEqual(["Alpha b", "Delta b"]);
    });

    it("exclut les valeurs manquantes dès qu'une plage est restreinte", () => {
        expect(names("annee-min=2000")).toEqual(["Beta b", "Gamma b"]);
        expect(names("rayon-max=2")).toEqual(["Beta b", "Gamma b"]);
        expect(names("distance-min=0")).not.toContain("Delta b");
    });

    it("ne garde que les masses et rayons mesurés si demandé", () => {
        expect(names("mesurees=1")).toEqual(["Beta b", "Delta b"]);
        expect(planets.map(hasMeasuredMassAndRadius)).toEqual([false, true, false, true]);
    });

    it("trie avec les valeurs manquantes toujours en dernier", () => {
        expect(sortPlanets(planets, "annee", "desc").map(({ name }) => name)).toEqual(["Gamma b", "Beta b", "Alpha b", "Delta b"]);
        expect(sortPlanets(planets, "annee", "asc").map(({ name }) => name)).toEqual(["Alpha b", "Beta b", "Gamma b", "Delta b"]);
        expect(sortPlanets(planets, "nom", "desc").map(({ name }) => name)).toEqual(["Gamma b", "Delta b", "Beta b", "Alpha b"]);
    });

    it("renvoie une page bornée de résumés", () => {
        const page = runCatalogQuery(catalog.entries, { ...defaultCatalogQuery, pageSize: 10, page: 50 });
        expect(page).toMatchObject({ page: 1, total: 4, totalPages: 1 });
        expect(Object.keys(page.items[0] ?? {})).not.toContain("discoveryFacility");
    });
});

describe("pagination", () => {
    it("découpe et ramène la page dans les bornes", () => {
        const items = Array.from({ length: 23 }, (_, index) => index);
        expect(paginate(items, 3, 10)).toEqual({ items: [20, 21, 22], page: 3, pageSize: 10, total: 23, totalPages: 3 });
        expect(paginate(items, 9, 10).page).toBe(3);
        expect(paginate([], 1, 10)).toEqual({ items: [], page: 1, pageSize: 10, total: 0, totalPages: 1 });
    });

    it("génère des liens de pages avec des ellipses", () => {
        expect(getPageLinks(5, 10)).toEqual([
            { kind: "page", page: 1 },
            { kind: "gap", key: "gap-4" },
            { kind: "page", page: 4 },
            { kind: "page", page: 5 },
            { kind: "page", page: 6 },
            { kind: "gap", key: "gap-10" },
            { kind: "page", page: 10 }
        ]);
        expect(getPageLinks(1, 1)).toEqual([{ kind: "page", page: 1 }]);
    });
});

describe("échelles des curseurs", () => {
    const bounds = computeRangeBounds(catalog.entries);

    it("arrondit les bornes à des puissances de dix en échelle logarithmique", () => {
        expect(bounds.masse.scale).toBe("log");
        expect(bounds.masse.min).toBe(1);
        expect(bounds.masse.max).toBe(10_000);
        expect(bounds.annee).toEqual({ min: 1995, max: 2020, scale: "linear" });
    });

    it("convertit une position de curseur en valeur et inversement", () => {
        expect(fromSliderPosition(0, bounds.masse)).toBe(1);
        expect(fromSliderPosition(sliderResolution, bounds.masse)).toBe(10_000);
        expect(fromSliderPosition(toSliderPosition(10, bounds.masse), bounds.masse)).toBeCloseTo(10, 1);
        expect(toSliderPosition(2007.5, bounds.annee)).toBe(500);
        expect(toSliderPosition(1_000_000, bounds.masse)).toBe(sliderResolution);
    });
});

describe("comparaison", () => {
    it("valide et limite les identifiants", () => {
        expect(parseComparisonSlugs(null)).toEqual({ success: true, slugs: [] });
        expect(parseComparisonSlugs(" a-b , c ,a-b,")).toEqual({ success: true, slugs: ["a-b", "c"] });
        expect(parseComparisonSlugs("a,b,c,d,e").success).toBe(false);
        expect(parseComparisonSlugs("a,../b").success).toBe(false);
        expect(parseComparisonSlugs("a".repeat(400)).success).toBe(false);
        expect(serializeComparison(["a", "b"])).toBe("a,b");
    });

    it("ajoute ou retire une planète sans dépasser la limite", () => {
        expect(toggleSelection(["a"], "b")).toEqual(["a", "b"]);
        expect(toggleSelection(["a", "b"], "a")).toEqual(["b"]);
        expect(toggleSelection(["a", "b", "c", "d"], "e")).toHaveLength(comparisonLimits.max);
    });

    it("met en évidence les extrêmes uniquement entre valeurs connues et différentes", () => {
        const rows = buildComparisonRows(planets.slice(0, 3));
        const mass = rows.find(({ key }) => key === "mass");
        expect(mass?.cells.map(({ extreme }) => extreme)).toEqual(["highest", "lowest", null]);
        expect(mass?.cells[0]?.origin).toBe("minimum");
        const radius = rows.find(({ key }) => key === "radius");
        expect(radius?.cells.map(({ value, extreme }) => [value === null, extreme])).toEqual([[true, null], [false, "lowest"], [false, "highest"]]);
        const eccentricity = rows.find(({ key }) => key === "eccentricity");
        expect(eccentricity?.cells.every(({ extreme }) => extreme === null)).toBe(true);
        const density = rows.find(({ key }) => key === "density");
        expect(density?.cells.map(({ value, origin }) => [value === null, origin])).toEqual([[true, null], [false, "calculated"], [true, null]]);
    });
});

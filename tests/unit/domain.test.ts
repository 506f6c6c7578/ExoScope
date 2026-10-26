import { describe, expect, it } from "vitest";
import { computeDensity } from "@/domain/exoplanets/density";
import { findDiscoveryMethod, getDiscoveryMethodLabel } from "@/domain/exoplanets/discovery-methods";
import { getOrigin, toReference, toSummary } from "@/domain/exoplanets/model";
import { findSimilarPlanets } from "@/domain/exoplanets/related";
import { searchPlanets } from "@/domain/exoplanets/search";
import { countByMethod, getCatalogStatistics } from "@/domain/exoplanets/statistics";
import { createSlug, isSlug, normalizeSearchText, toSearchKey } from "@/domain/exoplanets/text";
import {
    earthToJupiterMasses,
    earthToJupiterRadii,
    jupiterToEarthMasses,
    jupiterToEarthRadii,
    lightYearsToParsecs,
    mapKnown,
    parsecsToLightYears
} from "@/domain/units/conversions";
import { makeCatalog, makePlanet } from "./fixtures";

describe("conversions d'unités", () => {
    it("convertit parsecs et années-lumière dans les deux sens", () => {
        expect(parsecsToLightYears(1)).toBeCloseTo(3.2616, 4);
        expect(lightYearsToParsecs(parsecsToLightYears(12.43))).toBeCloseTo(12.43, 10);
    });

    it("convertit masses et rayons joviens en unités terrestres", () => {
        expect(jupiterToEarthMasses(1)).toBeCloseTo(317.83, 2);
        expect(jupiterToEarthRadii(1)).toBeCloseTo(11.209, 3);
        expect(earthToJupiterMasses(jupiterToEarthMasses(0.5))).toBeCloseTo(0.5, 10);
        expect(earthToJupiterRadii(jupiterToEarthRadii(2))).toBeCloseTo(2, 10);
    });

    it("propage les valeurs inconnues sans les convertir", () => {
        expect(mapKnown(null, parsecsToLightYears)).toBeNull();
        expect(mapKnown(2, (value) => value * 2)).toBe(4);
    });
});

describe("texte et identifiants", () => {
    it.each([
        ["TRAPPIST-1 e", "trappist-1-e"],
        ["51 Peg b", "51-peg-b"],
        ["PSR B1257+12 c", "psr-b1257-plus-12-c"],
        ["DENIS-P J082303.1-491201 b", "denis-p-j082303-1-491201-b"],
        ["Teegarden's Star b", "teegarden-s-star-b"],
        ["  Étoile   Été b ", "etoile-ete-b"]
    ])("crée un slug stable pour %s", (name, slug) => {
        expect(createSlug(name)).toBe(slug);
        expect(isSlug(createSlug(name))).toBe(true);
    });

    it("distingue les signes + et - dans les désignations", () => {
        expect(createSlug("2MASS J1234+5678 b")).not.toBe(createSlug("2MASS J1234-5678 b"));
    });

    it.each(["", "../etc", "Trappist-1-e", "a--b", "-a", "a".repeat(81), "a b", "a%2Fb"])("refuse l'identifiant %j", (value) => {
        expect(isSlug(value)).toBe(false);
    });

    it("normalise accents, casse et espaces pour la recherche", () => {
        expect(normalizeSearchText("  ÉTOILE   du  Berger ")).toBe("etoile du berger");
        expect(toSearchKey("TRAPPIST-1 e")).toBe(toSearchKey("trappist 1e"));
    });
});

describe("méthodes de découverte", () => {
    it("fait correspondre les libellés de l'archive aux méthodes internes", () => {
        expect(findDiscoveryMethod("Radial Velocity")).toBe("vitesse-radiale");
        expect(findDiscoveryMethod("Transit Timing Variations")).toBe("variation-temps-transit");
        expect(findDiscoveryMethod("Telepathy")).toBeNull();
        expect(getDiscoveryMethodLabel("microlentille")).toBe("Microlentille gravitationnelle");
    });
});

describe("densité", () => {
    const earth = makePlanet({ name: "Terre b", massJupiter: earthToJupiterMasses(1), radiusJupiter: earthToJupiterRadii(1) });

    it("calcule la densité terrestre à partir de la masse et du rayon", () => {
        expect(computeDensity(earth)?.gramsPerCubicCentimeter).toBeCloseTo(5.5, 1);
        expect(computeDensity(earth)?.isMinimum).toBe(false);
    });

    it("ne calcule rien sans masse ou sans rayon", () => {
        expect(computeDensity({ ...earth, massJupiter: null })).toBeNull();
        expect(computeDensity({ ...earth, radiusJupiter: null })).toBeNull();
    });

    it("refuse les valeurs estimées et signale une densité minimale", () => {
        expect(computeDensity({ ...earth, provenance: { radius: "estimated" } })).toBeNull();
        expect(computeDensity({ ...earth, provenance: { mass: "estimated" } })).toBeNull();
        expect(computeDensity({ ...earth, provenance: { mass: "upper-limit" } })).toBeNull();
        expect(computeDensity({ ...earth, provenance: { mass: "minimum" } })?.isMinimum).toBe(true);
    });
});

describe("modèle", () => {
    it("lit la provenance et réduit une planète à ses champs publics", () => {
        const planet = makePlanet({ name: "Kepler-1 b", provenance: { mass: "minimum" } });
        expect(getOrigin(planet, "mass")).toBe("minimum");
        expect(getOrigin(planet, "radius")).toBeNull();
        expect(Object.keys(toSummary(planet))).not.toContain("stellarRadiusSolar");
        expect(toReference(planet)).toEqual({
            slug: planet.slug,
            name: planet.name,
            hostStarName: planet.hostStarName,
            discoveryYear: 2020,
            discoveryMethod: "transit"
        });
    });
});

describe("catalogue, recherche et statistiques", () => {
    const planets = [
        makePlanet({ name: "Kepler-10 b", discoveryYear: 2011 }),
        makePlanet({ name: "Kepler-2 b", discoveryYear: 2009 }),
        makePlanet({ name: "Kepler-2 c", discoveryYear: 2013, discoveryMethod: "vitesse-radiale" }),
        makePlanet({ name: "TRAPPIST-1 e", discoveryYear: 2017, radiusJupiter: 0.082, orbitalPeriodDays: 6.1 }),
        makePlanet({ name: "LHS 1140 b", discoveryYear: 2017, radiusJupiter: 0.08, orbitalPeriodDays: 6, hostStarName: "LHS 1140" }),
        makePlanet({ name: "Orphan b", hostStarName: null, discoveryYear: null, discoveryMethod: null })
    ];
    const catalog = makeCatalog(planets);

    it("retrouve une planète, un groupe et un système", () => {
        expect(catalog.findBySlug("kepler-2-b")?.name).toBe("Kepler-2 b");
        expect(catalog.findBySlug("absente")).toBeNull();
        expect(catalog.findAll(["kepler-2-c", "absente", "kepler-2-b"]).map(({ name }) => name)).toEqual(["Kepler-2 c", "Kepler-2 b"]);
        const keplerTwo = catalog.findBySlug("kepler-2-b");
        expect(keplerTwo && catalog.findSystem(keplerTwo).map(({ name }) => name)).toEqual(["Kepler-2 b", "Kepler-2 c"]);
    });

    it("classe les résultats de recherche par pertinence puis par ordre naturel", () => {
        expect(searchPlanets(catalog.entries, "kepler-2", 10).map(({ name }) => name)).toEqual(["Kepler-2 b", "Kepler-2 c"]);
        expect(searchPlanets(catalog.entries, "kepler", 10).map(({ name }) => name)).toEqual(["Kepler-2 b", "Kepler-2 c", "Kepler-10 b"]);
        expect(searchPlanets(catalog.entries, "trappist 1e", 10)).toHaveLength(1);
        expect(searchPlanets(catalog.entries, "kepler", 1)).toHaveLength(1);
        expect(searchPlanets(catalog.entries, "---", 10)).toEqual([]);
    });

    it("calcule les statistiques sans compter les valeurs manquantes", () => {
        const statistics = getCatalogStatistics(planets);
        expect(statistics.planetCount).toBe(6);
        expect(statistics.systemCount).toBe(5);
        expect(statistics.latestDiscoveryYear).toBe(2017);
        expect(statistics.methods[0]).toEqual({ key: "transit", count: 4 });
        expect(countByMethod(statistics, "astrometrie")).toBe(0);
        expect(statistics.discoveriesByYear[0]).toEqual({ key: 2009, count: 1 });
        expect(statistics.discoveriesByYear.at(-1)).toEqual({ key: 2017, count: 2 });
        expect(statistics.discoveriesByYear).toHaveLength(9);
    });

    it("propose des mondes comparables d'autres systèmes", () => {
        const trappist = catalog.findBySlug("trappist-1-e");
        expect(trappist && findSimilarPlanets(catalog.entries, trappist, 1)[0]?.name).toBe("LHS 1140 b");
        expect(findSimilarPlanets(catalog.entries, makePlanet({ name: "Vide b", radiusJupiter: null, massJupiter: null }), 3)).toEqual([]);
    });
});

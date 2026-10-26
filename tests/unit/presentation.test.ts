import { describe, expect, it } from "vitest";
import { getReferencePoints, sampleScatter, toScatterPoint } from "@/domain/charts/scatter";
import { decadeTicks, linearTicks, logPosition } from "@/domain/charts/scale";
import { summaryProperties } from "@/domain/exoplanets/properties";
import { parseStoredList } from "@/hooks/use-comparison-list";
import { formatMeasurement, formatPlanetProperty, notAvailable } from "@/lib/formatting/measurement";
import { formatCount, formatDate, formatQuantity, formatSignificant, unitSpace } from "@/lib/formatting/number";
import { describePlanet } from "@/lib/formatting/summary";
import { getCatalogueUrl, getComparisonApiUrl, getComparisonUrl } from "@/lib/url";
import { catalogPageSchema, comparisonResponseSchema, searchResponseSchema } from "@/lib/validation/api";
import { makePlanet } from "./fixtures";

describe("formatage des nombres", () => {
    it("arrondit à trois chiffres significatifs avec le format français", () => {
        expect(formatSignificant(0.0021772)).toBe("0,00218");
        expect(formatSignificant(12.4298)).toBe("12,4");
        expect(formatSignificant(3178.4)).toBe(`3${" "}178`);
    });

    it("sépare toujours la valeur de son unité par une espace insécable", () => {
        expect(formatQuantity(6.101013, "significant", "j")).toBe(`6,1${unitSpace}j`);
        expect(formatQuantity(2017, "year", null)).toBe("2017");
        expect(formatQuantity(0.0051, "ratio", null)).toBe("0,005");
        expect(formatQuantity(249.7, "integer", "K")).toBe(`250${unitSpace}K`);
    });

    it("accorde les quantités et formate les dates", () => {
        expect(formatCount(1, "planète")).toBe(`1${unitSpace}planète`);
        expect(formatCount(2, "planète")).toBe(`2${unitSpace}planètes`);
        expect(formatDate("2026-10-26T18:20:43.892Z")).toBe("26 octobre 2026");
    });
});

describe("affichage des mesures", () => {
    const property = summaryProperties.mass;

    it("affiche Non renseigné pour une valeur manquante", () => {
        expect(formatMeasurement(null, null, property)).toEqual({ text: notAvailable, origin: null, known: false });
    });

    it("préfixe les valeurs selon leur provenance", () => {
        expect(formatMeasurement(1.05, "minimum", property).text).toBe(`≥ 1,05${unitSpace}M⊕`);
        expect(formatMeasurement(1.05, "estimated", property).text).toBe(`≈ 1,05${unitSpace}M⊕`);
        expect(formatMeasurement(1.05, "upper-limit", property).text).toBe(`≤ 1,05${unitSpace}M⊕`);
        expect(formatMeasurement(1.05, "calculated", property).text).toBe(`1,05${unitSpace}M⊕`);
    });

    it("lit la provenance de la planète pour la propriété affichée", () => {
        const planet = makePlanet({ name: "Kepler-1 b", massJupiter: 1, provenance: { mass: "estimated", radius: "minimum" } });
        expect(formatPlanetProperty(planet, summaryProperties.mass)).toMatchObject({ origin: "estimated", known: true });
        expect(formatPlanetProperty(planet, summaryProperties.distance).origin).toBeNull();
    });
});

describe("résumé d'une planète", () => {
    it("ne mentionne que les données connues, avec la bonne nuance", () => {
        const planet = makePlanet({
            name: "Proxima Cen b",
            hostStarName: "Proxima Cen",
            discoveryMethod: "vitesse-radiale",
            discoveryYear: 2016,
            distanceParsecs: 1.30119,
            massJupiter: 0.00332,
            radiusJupiter: 0.0913,
            orbitalPeriodDays: 11.18,
            provenance: { mass: "minimum", radius: "estimated" }
        });
        expect(describePlanet(planet)).toEqual([
            "Proxima Cen b orbite autour de l'étoile Proxima Cen, à environ 4,24 années-lumière de la Terre.",
            "Elle a été découverte en 2016 (méthode : vitesse radiale).",
            "Son rayon est estimé à environ 1,02 fois celui de la Terre.",
            "Sa masse vaut au moins 1,06 fois celle de la Terre.",
            "Sa période orbitale vaut 11,2 jours."
        ]);
    });

    it("se limite à une phrase quand presque tout manque", () => {
        const planet = makePlanet({
            name: "Inconnue b",
            hostStarName: null,
            discoveryYear: null,
            distanceParsecs: null,
            massJupiter: null,
            radiusJupiter: null,
            orbitalPeriodDays: null
        });
        expect(describePlanet(planet)).toEqual(["Inconnue b est une exoplanète confirmée."]);
    });
});

describe("graphiques", () => {
    it("calcule des graduations lisibles", () => {
        expect(linearTicks(1504, 4)).toEqual({ max: 2000, ticks: [0, 500, 1000, 1500, 2000] });
        expect(decadeTicks(0.1, 1000)).toEqual([0.1, 1, 10, 100, 1000]);
        expect(logPosition(10, 1, 100)).toBeCloseTo(0.5);
    });

    it("échantillonne un nuage de points borné et ignore les valeurs manquantes", () => {
        const planets = Array.from({ length: 50 }, (_, index) => makePlanet({ name: `P-${index} b`, massJupiter: 0.01 * (index + 1) }));
        expect(sampleScatter(planets, "massRadius", 10)).toHaveLength(10);
        expect(sampleScatter(planets, "massRadius")).toHaveLength(50);
        expect(toScatterPoint(makePlanet({ name: "X b", radiusJupiter: null }), "massRadius")).toBeNull();
        expect(sampleScatter([makePlanet({ name: "Y b", provenance: { mass: "estimated" } })], "massRadius")).toEqual([]);
        expect(getReferencePoints("orbit").find(({ name }) => name === "Terre")).toEqual({ name: "Terre", x: 365.25, y: 1 });
    });
});

describe("URL et données côté client", () => {
    it("construit les adresses du catalogue et du comparateur", () => {
        expect(getCatalogueUrl()).toBe("/catalogue");
        expect(getCatalogueUrl({ methods: ["transit"], host: "TRAPPIST-1" })).toBe("/catalogue?etoile=TRAPPIST-1&methode=transit");
        expect(getComparisonUrl([])).toBe("/comparer");
        expect(getComparisonUrl(["a", "b"])).toBe("/comparer?planetes=a%2Cb");
        expect(getComparisonApiUrl(["a"])).toBe("/api/exoplanets/compare?planetes=a");
    });

    it("valide la liste de comparaison stockée localement", () => {
        expect(parseStoredList(null)).toEqual([]);
        expect(parseStoredList("{")).toEqual([]);
        expect(parseStoredList('["a","a","b"]')).toEqual(["a", "b"]);
        expect(parseStoredList('["a","b","c","d","e"]')).toEqual([]);
        expect(parseStoredList('["<script>"]')).toEqual([]);
    });

    it("rejette des réponses d'API inattendues", () => {
        expect(searchResponseSchema.safeParse({ results: [] }).success).toBe(true);
        expect(searchResponseSchema.safeParse({ results: [{ slug: "x" }] }).success).toBe(false);
        expect(catalogPageSchema.safeParse({ items: [], page: 1, pageSize: 25, total: 0, totalPages: -1 }).success).toBe(false);
        expect(comparisonResponseSchema.safeParse({ planets: [makePlanet({ name: "Z b" })], missing: [] }).success).toBe(true);
    });
});

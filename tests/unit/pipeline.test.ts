import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { refreshCatalog, refreshGuards } from "../../scripts/refresh-exoplanet-catalog";
import serializedSnapshot from "@/data/generated/exoplanets.json?raw";
import { parseSnapshot, serializeSnapshot, snapshotLimits, snapshotSchema } from "@/lib/validation/snapshot";
import { allowedArchiveHosts, ArchiveUnavailableError, type Fetcher, fetchArchiveRows } from "@/services/exoplanet-archive/client";
import { createNormalizationIssues, normalizeArchiveRow } from "@/services/exoplanet-archive/normalize";
import { archiveColumns, catalogQuery, createArchiveRequestUrl } from "@/services/exoplanet-archive/query";
import { buildSnapshot } from "@/services/exoplanet-archive/snapshot-builder";
import { calculatedReference, makeArchiveRow, makePlanet, makeSnapshot } from "./fixtures";

function jsonFetcher(body: unknown, init: ResponseInit = {}): Fetcher {
    return () => Promise.resolve(new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
        ...init
    }));
}

function archiveRows(count: number) {
    return Array.from({ length: count }, (_, index) => makeArchiveRow({ pl_name: `Test-${index} b`, hostname: `Test-${index}` }));
}

describe("requête vers l'archive", () => {
    it("utilise une requête fixe limitée aux colonnes autorisées vers un hôte autorisé", () => {
        const url = createArchiveRequestUrl();
        expect(url.protocol).toBe("https:");
        expect(allowedArchiveHosts.has(url.hostname)).toBe(true);
        expect(url.searchParams.get("query")).toBe(catalogQuery);
        expect(catalogQuery).toBe(`select ${archiveColumns.join(",")} from pscomppars order by pl_name`);
        expect(url.searchParams.get("format")).toBe("json");
    });

    it("interdit les redirections et impose un délai d'expiration", async () => {
        let received: RequestInit | undefined;
        await fetchArchiveRows((_, init) => {
            received = init;
            return jsonFetcher([])(_, init);
        });
        expect(received?.redirect).toBe("error");
        expect(received?.signal).toBeInstanceOf(AbortSignal);
    });

    it.each([
        ["injoignable", () => Promise.reject(new TypeError("fetch failed"))],
        ["en erreur HTTP", jsonFetcher({ error: "maintenance" }, { status: 503 })],
        ["sans JSON", jsonFetcher("<html>", { headers: { "Content-Type": "text/html" } })],
        ["trop volumineuse", jsonFetcher([], { headers: { "Content-Type": "application/json", "Content-Length": String(64 * 1024 * 1024) } })],
        ["au JSON invalide", () => Promise.resolve(new Response("{", { headers: { "Content-Type": "application/json" } }))]
    ] satisfies [string, Fetcher][])("signale une archive %s", async (_, fetcher) => {
        await expect(fetchArchiveRows(fetcher)).rejects.toBeInstanceOf(ArchiveUnavailableError);
    });
});

describe("normalisation", () => {
    it("transforme une ligne brute en modèle interne", () => {
        const planet = normalizeArchiveRow(makeArchiveRow(), createNormalizationIssues());
        expect(planet).toMatchObject({
            slug: "trappist-1-e",
            name: "TRAPPIST-1 e",
            hostStarName: "TRAPPIST-1",
            discoveryMethod: "transit",
            discoveryYear: 2017,
            constellation: "Aqr",
            controversial: false,
            provenance: {}
        });
    });

    it("distingue valeurs minimales, estimées, calculées et limites", () => {
        const planet = normalizeArchiveRow(makeArchiveRow({
            pl_bmassprov: "Msini",
            pl_radj_reflink: calculatedReference,
            pl_eqt_reflink: calculatedReference,
            pl_orbeccenlim: 1
        }), createNormalizationIssues());
        expect(planet.provenance).toEqual({
            mass: "minimum",
            radius: "estimated",
            equilibriumTemperature: "calculated",
            eccentricity: "upper-limit"
        });
        const estimated = normalizeArchiveRow(makeArchiveRow({ pl_bmassprov: "M-R relationship", pl_bmassjlim: -1 }), createNormalizationIssues());
        expect(estimated.provenance.mass).toBe("lower-limit");
    });

    it("écarte les valeurs implausibles et les libellés invalides sans inventer de donnée", () => {
        const issues = createNormalizationIssues();
        const planet = normalizeArchiveRow(makeArchiveRow({
            pl_radj: -1,
            pl_orbeccen: 1.2,
            pl_bmassj: null,
            hostname: "  ",
            disc_facility: "bad\u0007name",
            discoverymethod: "Telepathy",
            ra: null
        }), issues);
        expect(planet).toMatchObject({
            radiusJupiter: null,
            eccentricity: null,
            massJupiter: null,
            hostStarName: null,
            discoveryFacility: null,
            discoveryMethod: null,
            constellation: null
        });
        expect(planet.provenance).toEqual({});
        expect(issues.discardedValues).toEqual({ radiusJupiter: 1, eccentricity: 1 });
        expect([...issues.unknownMethods]).toEqual(["Telepathy"]);
    });
});

describe("snapshot", () => {
    it("valide le snapshot versionné du dépôt", () => {
        const snapshot = parseSnapshot(serializedSnapshot);
        expect(snapshot.planets.length).toBeGreaterThan(refreshGuards.minPlanets);
        expect(Buffer.byteLength(serializedSnapshot)).toBeLessThan(snapshotLimits.maxBytes);
    });

    it("rejette les lignes invalides et rapporte leur nombre", () => {
        const { snapshot, report } = buildSnapshot([
            makeArchiveRow(),
            { pl_name: "" },
            "pas un objet",
            makeArchiveRow({ pl_name: "WASP-12 b", disc_year: 2008.5 })
        ], new Date("2026-10-26T00:00:00Z"));
        expect(snapshot.planets.map(({ name }) => name)).toEqual(["TRAPPIST-1 e"]);
        expect(report.rejectedRows).toBe(3);
        expect(report.receivedRows).toBe(4);
        expect(snapshot.retrievedAt).toBe("2026-10-26T00:00:00.000Z");
    });

    it("refuse une réponse qui n'est pas une liste ou des identifiants en double", () => {
        expect(() => buildSnapshot({ rows: [] }, new Date())).toThrow();
        expect(() => buildSnapshot([makeArchiveRow(), makeArchiveRow()], new Date())).toThrow();
    });

    it("rejette un snapshot mal formé", () => {
        const valid = makeSnapshot([makePlanet({ name: "Kepler-1 b" })]);
        expect(snapshotSchema.safeParse(valid).success).toBe(true);
        expect(snapshotSchema.safeParse({ ...valid, schemaVersion: 2 }).success).toBe(false);
        expect(snapshotSchema.safeParse(makeSnapshot([makePlanet({ name: "Kepler-1 b", slug: "../x" })])).success).toBe(false);
        expect(snapshotSchema.safeParse(makeSnapshot([makePlanet({ name: "Kepler-1 b", eccentricity: 1 })])).success).toBe(false);
        expect(snapshotSchema.safeParse({ ...valid, planets: [{ ...valid.planets[0], extra: true }] }).success).toBe(false);
        expect(() => parseSnapshot("x".repeat(snapshotLimits.maxBytes + 1))).toThrow("taille autorisée");
    });

    it("sérialise une planète par ligne et relit le même contenu", () => {
        const snapshot = makeSnapshot([makePlanet({ name: "Kepler-1 b" }), makePlanet({ name: "Kepler-2 b" })]);
        const serialized = serializeSnapshot(snapshot);
        expect(serialized.split("\n")).toHaveLength(5);
        expect(parseSnapshot(serialized)).toEqual(snapshot);
    });
});

describe("mise à jour du catalogue", () => {
    let directory: string;
    let outputPath: string;
    const now = () => new Date("2026-10-26T12:00:00Z");

    beforeEach(async () => {
        directory = await mkdtemp(join(tmpdir(), "exoscope-"));
        outputPath = join(directory, "exoplanets.json");
    });

    afterEach(() => rm(directory, { recursive: true, force: true }));

    it("écrit un snapshot valide et un rapport sans données brutes", async () => {
        const report = await refreshCatalog({ fetcher: jsonFetcher(archiveRows(refreshGuards.minPlanets)), outputPath, now });
        expect(report).toMatchObject({ planetCount: refreshGuards.minPlanets, previousPlanetCount: null, rejectedRows: 0 });
        expect(parseSnapshot(await readFile(outputPath, "utf8")).planets).toHaveLength(refreshGuards.minPlanets);
        expect(await readdir(directory)).toEqual(["exoplanets.json"]);
        expect(JSON.stringify(report)).not.toContain("Test-0");
    });

    it("conserve le dernier snapshot valide si l'archive est indisponible", async () => {
        await writeFile(outputPath, "contenu précédent");
        await expect(refreshCatalog({ fetcher: () => Promise.reject(new TypeError("fetch failed")), outputPath, now }))
            .rejects.toBeInstanceOf(ArchiveUnavailableError);
        expect(await readFile(outputPath, "utf8")).toBe("contenu précédent");
    });

    it("refuse un catalogue trop petit ou en forte baisse", async () => {
        await expect(refreshCatalog({ fetcher: jsonFetcher(archiveRows(10)), outputPath, now })).rejects.toThrow("minimum attendu");
        await refreshCatalog({ fetcher: jsonFetcher(archiveRows(5_000)), outputPath, now });
        const previous = await readFile(outputPath, "utf8");
        await expect(refreshCatalog({ fetcher: jsonFetcher(archiveRows(4_100)), outputPath, now })).rejects.toThrow("baisse anormale");
        expect(await readFile(outputPath, "utf8")).toBe(previous);
    });
});

import { createCatalog } from "@/domain/exoplanets/catalog";
import type { CatalogSnapshot, Exoplanet } from "@/domain/exoplanets/model";
import type { ArchiveRow } from "@/services/exoplanet-archive/raw-schema";

export function makePlanet(overrides: Partial<Exoplanet> & Pick<Exoplanet, "name">): Exoplanet {
    return {
        slug: overrides.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        hostStarName: overrides.name.replace(/ [a-z]$/, ""),
        discoveryYear: 2020,
        discoveryMethod: "transit",
        discoveryFacility: null,
        distanceParsecs: 10,
        massJupiter: 0.01,
        radiusJupiter: 0.1,
        orbitalPeriodDays: 10,
        semiMajorAxisAu: 0.1,
        eccentricity: 0,
        equilibriumTemperatureKelvin: 300,
        stellarEffectiveTemperatureKelvin: 5_000,
        stellarRadiusSolar: 1,
        systemPlanetCount: 1,
        constellation: null,
        controversial: false,
        provenance: {},
        ...overrides
    };
}

export function makeSnapshot(planets: Exoplanet[]): CatalogSnapshot {
    return {
        schemaVersion: 1,
        source: { name: "NASA Exoplanet Archive", table: "pscomppars", url: "https://exoplanetarchive.ipac.caltech.edu" },
        retrievedAt: "2026-10-26T12:00:00.000Z",
        planets
    };
}

export function makeCatalog(planets: Exoplanet[]) {
    return createCatalog(makeSnapshot(planets));
}

export function makeArchiveRow(overrides: Partial<ArchiveRow> = {}): ArchiveRow {
    return {
        pl_name: "TRAPPIST-1 e",
        hostname: "TRAPPIST-1",
        sy_pnum: 7,
        discoverymethod: "Transit",
        disc_year: 2017,
        disc_facility: "Multiple Observatories",
        sy_dist: 12.43,
        pl_bmassj: 0.00217728,
        pl_bmassjlim: 0,
        pl_bmassprov: "Mass",
        pl_bmassj_reflink: "<a refstr=AGOL_ET_AL__2021>Agol et al. 2021</a>",
        pl_radj: 0.08207704,
        pl_radjlim: 0,
        pl_radj_reflink: "<a refstr=AGOL_ET_AL__2021>Agol et al. 2021</a>",
        pl_orbper: 6.101013,
        pl_orbperlim: 0,
        pl_orbper_reflink: null,
        pl_orbsmax: 0.02925,
        pl_orbsmaxlim: 0,
        pl_orbsmax_reflink: null,
        pl_orbeccen: 0.00510,
        pl_orbeccenlim: 0,
        pl_orbeccen_reflink: null,
        pl_eqt: 249.7,
        pl_eqtlim: 0,
        pl_eqt_reflink: null,
        st_teff: 2566,
        st_rad: 0.1192,
        ra: 346.6263919,
        dec: -5.0434618,
        pl_controv_flag: 0,
        ...overrides
    };
}

export const calculatedReference = "<a refstr=CALCULATED_VALUE href=/docs/pscp_calc.html>Calculated Value</a>";

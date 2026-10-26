import { Constellation } from "astronomy-engine";
import { type ConstellationCode, isConstellationCode } from "@/data/constellations";
import { findDiscoveryMethod } from "@/domain/exoplanets/discovery-methods";
import type { Exoplanet, Provenance, QualifiedQuantity, ValueOrigin } from "@/domain/exoplanets/model";
import { createSlug } from "@/domain/exoplanets/text";
import type { ArchiveRow } from "@/services/exoplanet-archive/raw-schema";

type LimitFlag = -1 | 0 | 1 | null;

interface Bounds {
    min: number;
    max: number;
    exclusiveMin?: true;
    exclusiveMax?: true;
}

export const plausibleBounds = {
    distanceParsecs: { min: 0, max: 100_000, exclusiveMin: true },
    massJupiter: { min: 0, max: 100, exclusiveMin: true },
    radiusJupiter: { min: 0, max: 10, exclusiveMin: true },
    orbitalPeriodDays: { min: 0, max: 1e9, exclusiveMin: true },
    semiMajorAxisAu: { min: 0, max: 100_000, exclusiveMin: true },
    eccentricity: { min: 0, max: 1, exclusiveMax: true },
    equilibriumTemperatureKelvin: { min: 0, max: 10_000, exclusiveMin: true },
    stellarEffectiveTemperatureKelvin: { min: 0, max: 100_000, exclusiveMin: true },
    stellarRadiusSolar: { min: 0, max: 2_000, exclusiveMin: true },
    discoveryYear: { min: 1900, max: 2200 },
    systemPlanetCount: { min: 1, max: 100 }
} as const satisfies Record<string, Bounds>;

export type BoundedField = keyof typeof plausibleBounds;

export interface NormalizationIssues {
    discardedValues: Partial<Record<BoundedField, number>>;
    unknownMethods: Set<string>;
}

const calculatedValueMarker = "refstr=CALCULATED_VALUE";

const massProvenanceOrigins: Partial<Record<string, ValueOrigin>> = {
    Msini: "minimum",
    "M-R relationship": "estimated"
};

export function createNormalizationIssues(): NormalizationIssues {
    return { discardedValues: {}, unknownMethods: new Set() };
}

const printableLabel = /^\P{Cc}+$/u;

function isWithin(value: number, { min, max, exclusiveMin, exclusiveMax }: Bounds): boolean {
    return (exclusiveMin ? value > min : value >= min) && (exclusiveMax ? value < max : value <= max);
}

function cleanLabel(value: string | null, maxLength: number): string | null {
    const label = value?.trim() ?? "";
    return label.length > 0 && label.length <= maxLength && printableLabel.test(label) ? label : null;
}

function bounded(value: number | null, field: BoundedField, issues: NormalizationIssues): number | null {
    if (value === null) return null;
    if (isWithin(value, plausibleBounds[field])) return value;
    issues.discardedValues[field] = (issues.discardedValues[field] ?? 0) + 1;
    return null;
}

function getOrigin(limit: LimitFlag, reference: string | null, derivation: "empirical" | "physical"): ValueOrigin | undefined {
    if (limit === 1) return "upper-limit";
    if (limit === -1) return "lower-limit";
    if (reference?.includes(calculatedValueMarker)) return derivation === "empirical" ? "estimated" : "calculated";
    return undefined;
}

function getConstellation(rightAscension: number | null, declination: number | null): ConstellationCode | null {
    if (rightAscension === null || declination === null) return null;
    if (rightAscension < 0 || rightAscension >= 360 || declination < -90 || declination > 90) return null;
    const { symbol } = Constellation(rightAscension / 15, declination);
    return isConstellationCode(symbol) ? symbol : null;
}

function buildProvenance(row: ArchiveRow, known: Record<QualifiedQuantity, boolean>): Provenance {
    const origins: Record<QualifiedQuantity, ValueOrigin | undefined> = {
        mass: getOrigin(row.pl_bmassjlim, row.pl_bmassj_reflink, "empirical") ??
            (row.pl_bmassprov ? massProvenanceOrigins[row.pl_bmassprov] : undefined),
        radius: getOrigin(row.pl_radjlim, row.pl_radj_reflink, "empirical"),
        orbitalPeriod: getOrigin(row.pl_orbperlim, row.pl_orbper_reflink, "physical"),
        semiMajorAxis: getOrigin(row.pl_orbsmaxlim, row.pl_orbsmax_reflink, "physical"),
        eccentricity: getOrigin(row.pl_orbeccenlim, row.pl_orbeccen_reflink, "physical"),
        equilibriumTemperature: getOrigin(row.pl_eqtlim, row.pl_eqt_reflink, "physical")
    };
    const provenance: Provenance = {};
    for (const [quantity, origin] of Object.entries(origins) as [QualifiedQuantity, ValueOrigin | undefined][]) {
        if (origin && known[quantity]) provenance[quantity] = origin;
    }
    return provenance;
}

export function normalizeArchiveRow(row: ArchiveRow, issues: NormalizationIssues): Exoplanet {
    const methodName = cleanLabel(row.discoverymethod, 80);
    const discoveryMethod = methodName ? findDiscoveryMethod(methodName) : null;
    if (methodName && !discoveryMethod) issues.unknownMethods.add(methodName);

    const massJupiter = bounded(row.pl_bmassj, "massJupiter", issues);
    const radiusJupiter = bounded(row.pl_radj, "radiusJupiter", issues);
    const orbitalPeriodDays = bounded(row.pl_orbper, "orbitalPeriodDays", issues);
    const semiMajorAxisAu = bounded(row.pl_orbsmax, "semiMajorAxisAu", issues);
    const eccentricity = bounded(row.pl_orbeccen, "eccentricity", issues);
    const equilibriumTemperatureKelvin = bounded(row.pl_eqt, "equilibriumTemperatureKelvin", issues);

    return {
        slug: createSlug(row.pl_name),
        name: row.pl_name,
        hostStarName: cleanLabel(row.hostname, 120),
        discoveryYear: bounded(row.disc_year, "discoveryYear", issues),
        discoveryMethod,
        discoveryFacility: cleanLabel(row.disc_facility, 160),
        distanceParsecs: bounded(row.sy_dist, "distanceParsecs", issues),
        massJupiter,
        radiusJupiter,
        orbitalPeriodDays,
        semiMajorAxisAu,
        eccentricity,
        equilibriumTemperatureKelvin,
        stellarEffectiveTemperatureKelvin: bounded(row.st_teff, "stellarEffectiveTemperatureKelvin", issues),
        stellarRadiusSolar: bounded(row.st_rad, "stellarRadiusSolar", issues),
        systemPlanetCount: bounded(row.sy_pnum, "systemPlanetCount", issues),
        constellation: getConstellation(row.ra, row.dec),
        controversial: row.pl_controv_flag === 1,
        provenance: buildProvenance(row, {
            mass: massJupiter !== null,
            radius: radiusJupiter !== null,
            orbitalPeriod: orbitalPeriodDays !== null,
            semiMajorAxis: semiMajorAxisAu !== null,
            eccentricity: eccentricity !== null,
            equilibriumTemperature: equilibriumTemperatureKelvin !== null
        })
    };
}

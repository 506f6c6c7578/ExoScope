import { getDiscoveryMethodLabel } from "@/domain/exoplanets/discovery-methods";
import type { Exoplanet, ValueOrigin } from "@/domain/exoplanets/model";
import { summaryProperties } from "@/domain/exoplanets/properties";
import { formatSignificant } from "@/lib/formatting/number";

type Gender = "masculine" | "feminine";

const qualifiers: Record<ValueOrigin | "measured", Record<Gender, string>> = {
    measured: { masculine: "vaut", feminine: "vaut" },
    minimum: { masculine: "vaut au moins", feminine: "vaut au moins" },
    estimated: { masculine: "est estimé à environ", feminine: "est estimée à environ" },
    calculated: { masculine: "est calculé à", feminine: "est calculée à" },
    "upper-limit": { masculine: "est inférieur ou égal à", feminine: "est inférieure ou égale à" },
    "lower-limit": { masculine: "vaut au moins", feminine: "vaut au moins" }
};

function describeValue(subject: string, gender: Gender, value: number | null, origin: ValueOrigin | undefined, complement: string): string | null {
    if (value === null) return null;
    return `${subject} ${qualifiers[origin ?? "measured"][gender]} ${formatSignificant(value)} ${complement}.`;
}

export function describePlanet(planet: Exoplanet): string[] {
    const distance = summaryProperties.distance.read(planet);
    const location = [
        planet.hostStarName ? `${planet.name} orbite autour de l'étoile ${planet.hostStarName}` : `${planet.name} est une exoplanète confirmée`,
        distance === null ? "" : `, à environ ${formatSignificant(distance)} années-lumière de la Terre`
    ].join("");

    const discovery = planet.discoveryYear !== null && planet.discoveryMethod !== null
        ? `Elle a été découverte en ${planet.discoveryYear} (méthode : ${getDiscoveryMethodLabel(planet.discoveryMethod).toLowerCase()}).`
        : null;

    return [
        `${location}.`,
        discovery,
        describeValue("Son rayon", "masculine", summaryProperties.radius.read(planet), planet.provenance.radius, "fois celui de la Terre"),
        describeValue("Sa masse", "feminine", summaryProperties.mass.read(planet), planet.provenance.mass, "fois celle de la Terre"),
        describeValue("Sa période orbitale", "feminine", planet.orbitalPeriodDays, planet.provenance.orbitalPeriod, "jours")
    ].filter((sentence): sentence is string => sentence !== null);
}

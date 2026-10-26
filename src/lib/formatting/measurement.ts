import { type Exoplanet, getOrigin, type ValueOrigin } from "@/domain/exoplanets/model";
import type { PlanetProperty } from "@/domain/exoplanets/properties";
import { formatQuantity } from "@/lib/formatting/number";

export const notAvailable = "Non renseigné";

export const originLabels: Record<ValueOrigin, string> = {
    minimum: "valeur minimale",
    estimated: "estimée",
    calculated: "calculée",
    "upper-limit": "limite supérieure",
    "lower-limit": "limite inférieure"
};

export const originAbbreviations: Record<ValueOrigin, string> = {
    minimum: "min.",
    estimated: "est.",
    calculated: "calc.",
    "upper-limit": "lim.",
    "lower-limit": "lim."
};

export const originDescriptions: Record<ValueOrigin, string> = {
    minimum: "Masse minimale (M sin i) : l'inclinaison de l'orbite est inconnue, la masse réelle peut être plus élevée.",
    estimated: "Valeur estimée par l'archive à partir d'une relation empirique masse-rayon, pas d'une mesure directe.",
    calculated: "Valeur calculée à partir d'autres paramètres publiés, sans incertitude associée.",
    "upper-limit": "Seule une limite supérieure a été publiée : la valeur réelle est inférieure ou égale.",
    "lower-limit": "Seule une limite inférieure a été publiée : la valeur réelle est supérieure ou égale."
};

const originPrefixes: Record<ValueOrigin, string> = {
    minimum: "≥ ",
    estimated: "≈ ",
    calculated: "",
    "upper-limit": "≤ ",
    "lower-limit": "≥ "
};

export interface FormattedMeasurement {
    text: string;
    origin: ValueOrigin | null;
    known: boolean;
}

export function formatMeasurement(
    value: number | null,
    origin: ValueOrigin | null,
    { format, unit }: Pick<PlanetProperty<never>, "format" | "unit">
): FormattedMeasurement {
    if (value === null) return { text: notAvailable, origin: null, known: false };
    const prefix = origin ? originPrefixes[origin] : "";
    return { text: `${prefix}${formatQuantity(value, format, unit)}`, origin, known: true };
}

export function formatPlanetProperty<Planet extends Pick<Exoplanet, "provenance">>(
    planet: Planet,
    property: PlanetProperty<Planet>
): FormattedMeasurement {
    return formatMeasurement(property.read(planet), property.quantity ? getOrigin(planet, property.quantity) : null, property);
}

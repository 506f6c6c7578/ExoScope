import type { Exoplanet } from "@/domain/exoplanets/model";
import { physicalConstants } from "@/domain/units/conversions";

export interface DensityEstimate {
    gramsPerCubicCentimeter: number;
    isMinimum: boolean;
}

export function computeDensity({
    massJupiter,
    radiusJupiter,
    provenance
}: Pick<Exoplanet, "massJupiter" | "radiusJupiter" | "provenance">): DensityEstimate | null {
    if (massJupiter === null || radiusJupiter === null) return null;
    if (provenance.radius !== undefined) return null;
    if (provenance.mass !== undefined && provenance.mass !== "minimum") return null;

    const radiusCentimeters = radiusJupiter * physicalConstants.jupiterRadiusCentimeters;
    const volume = (4 / 3) * Math.PI * radiusCentimeters ** 3;
    return {
        gramsPerCubicCentimeter: (massJupiter * physicalConstants.jupiterMassGrams) / volume,
        isMinimum: provenance.mass === "minimum"
    };
}

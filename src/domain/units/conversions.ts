export const physicalConstants = {
    lightYearsPerParsec: 3.261_563_777,
    earthMassesPerJupiterMass: 317.828,
    earthRadiiPerJupiterRadius: 11.209,
    jupiterMassGrams: 1.898_13e30,
    jupiterRadiusCentimeters: 7.1492e9
} as const;

export function parsecsToLightYears(parsecs: number): number {
    return parsecs * physicalConstants.lightYearsPerParsec;
}

export function lightYearsToParsecs(lightYears: number): number {
    return lightYears / physicalConstants.lightYearsPerParsec;
}

export function jupiterToEarthMasses(jupiterMasses: number): number {
    return jupiterMasses * physicalConstants.earthMassesPerJupiterMass;
}

export function earthToJupiterMasses(earthMasses: number): number {
    return earthMasses / physicalConstants.earthMassesPerJupiterMass;
}

export function jupiterToEarthRadii(jupiterRadii: number): number {
    return jupiterRadii * physicalConstants.earthRadiiPerJupiterRadius;
}

export function earthToJupiterRadii(earthRadii: number): number {
    return earthRadii / physicalConstants.earthRadiiPerJupiterRadius;
}

export function mapKnown<Output>(value: number | null, convert: (value: number) => Output): Output | null {
    return value === null ? null : convert(value);
}

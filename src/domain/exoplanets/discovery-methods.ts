import type { DiscoveryMethod } from "@/domain/exoplanets/model";

interface DiscoveryMethodDefinition {
    label: string;
    archiveName: string;
}

export const discoveryMethodDefinitions = {
    transit: { label: "Transit", archiveName: "Transit" },
    "vitesse-radiale": { label: "Vitesse radiale", archiveName: "Radial Velocity" },
    "imagerie-directe": { label: "Imagerie directe", archiveName: "Imaging" },
    microlentille: { label: "Microlentille gravitationnelle", archiveName: "Microlensing" },
    astrometrie: { label: "Astrométrie", archiveName: "Astrometry" },
    "variation-temps-transit": { label: "Variation du temps de transit", archiveName: "Transit Timing Variations" },
    "variation-temps-eclipse": { label: "Variation du temps d'éclipse", archiveName: "Eclipse Timing Variations" },
    "chronometrie-pulsar": { label: "Chronométrie de pulsar", archiveName: "Pulsar Timing" },
    "variation-pulsation": { label: "Variation de pulsation stellaire", archiveName: "Pulsation Timing Variations" },
    "modulation-luminosite": { label: "Modulation de luminosité orbitale", archiveName: "Orbital Brightness Modulation" },
    "cinematique-disque": { label: "Cinématique du disque", archiveName: "Disk Kinematics" }
} as const satisfies Record<DiscoveryMethod, DiscoveryMethodDefinition>;

const methodsByArchiveName = new Map<string, DiscoveryMethod>(
    Object.entries(discoveryMethodDefinitions).map(([method, { archiveName }]) => [archiveName, method as DiscoveryMethod])
);

export function getDiscoveryMethodLabel(method: DiscoveryMethod): string {
    return discoveryMethodDefinitions[method].label;
}

export function findDiscoveryMethod(archiveName: string): DiscoveryMethod | null {
    return methodsByArchiveName.get(archiveName) ?? null;
}

import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { CatalogSnapshot } from "@/domain/exoplanets/model";
import { parseSnapshot, serializeSnapshot, snapshotLimits } from "@/lib/validation/snapshot";
import { type Fetcher, fetchArchiveRows } from "@/services/exoplanet-archive/client";
import { buildSnapshot, type SnapshotBuildReport } from "@/services/exoplanet-archive/snapshot-builder";

export const defaultSnapshotPath = fileURLToPath(new URL("../src/data/generated/exoplanets.json", import.meta.url));

export const refreshGuards = {
    minPlanets: 4_000,
    minRetainedRatio: 0.9
} as const;

interface RefreshOptions {
    fetcher?: Fetcher;
    outputPath?: string;
    now?: () => Date;
}

export interface RefreshReport extends SnapshotBuildReport {
    retrievedAt: string;
    planetCount: number;
    previousPlanetCount: number | null;
    bytes: number;
}

async function readPreviousSnapshot(path: string): Promise<CatalogSnapshot | null> {
    try {
        return parseSnapshot(await readFile(path, "utf8"));
    } catch {
        return null;
    }
}

function assertPlausible(snapshot: CatalogSnapshot, previous: CatalogSnapshot | null): void {
    const count = snapshot.planets.length;
    if (count < refreshGuards.minPlanets) {
        throw new Error(`Seulement ${count} planètes valides reçues, minimum attendu : ${refreshGuards.minPlanets}.`);
    }
    if (previous && count < previous.planets.length * refreshGuards.minRetainedRatio) {
        throw new Error(`Le catalogue passerait de ${previous.planets.length} à ${count} planètes : baisse anormale.`);
    }
}

async function writeAtomically(path: string, content: string): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    const temporaryPath = `${path}.${process.pid}.tmp`;
    try {
        await writeFile(temporaryPath, content, { encoding: "utf8", flag: "wx" });
        await rename(temporaryPath, path);
    } catch (error) {
        await rm(temporaryPath, { force: true });
        throw error;
    }
}

export async function refreshCatalog({
    fetcher = fetch,
    outputPath = defaultSnapshotPath,
    now = () => new Date()
}: RefreshOptions = {}): Promise<RefreshReport> {
    const response = await fetchArchiveRows(fetcher);
    const { snapshot, report } = buildSnapshot(response, now());
    const previous = await readPreviousSnapshot(outputPath);
    assertPlausible(snapshot, previous);

    const serialized = serializeSnapshot(snapshot);
    const bytes = Buffer.byteLength(serialized);
    if (bytes > snapshotLimits.maxBytes) {
        throw new Error(`Le snapshot pèserait ${bytes} octets, maximum autorisé : ${snapshotLimits.maxBytes}.`);
    }
    parseSnapshot(serialized);
    await writeAtomically(outputPath, serialized);

    return {
        ...report,
        retrievedAt: snapshot.retrievedAt,
        planetCount: snapshot.planets.length,
        previousPlanetCount: previous?.planets.length ?? null,
        bytes
    };
}

function formatReport(report: RefreshReport): string {
    return [
        `Snapshot mis à jour : ${report.planetCount} planètes (précédent : ${report.previousPlanetCount ?? "aucun"}).`,
        `Lignes reçues : ${report.receivedRows}, rejetées : ${report.rejectedRows} ${JSON.stringify(report.rejectedColumns)}.`,
        `Valeurs implausibles écartées : ${JSON.stringify(report.discardedValues)}.`,
        `Méthodes inconnues : ${report.unknownMethods.join(", ") || "aucune"}.`,
        `Taille : ${(report.bytes / 1024).toFixed(0)} Kio, récupéré le ${report.retrievedAt}.`
    ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    refreshCatalog().then(
        (report) => console.log(formatReport(report)),
        (error: unknown) => {
            console.error(`Échec de la mise à jour : ${error instanceof Error ? error.message : "erreur inconnue"}`);
            console.error("Le dernier snapshot valide est conservé.");
            process.exitCode = 1;
        }
    );
}

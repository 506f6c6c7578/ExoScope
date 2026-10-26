import type { CatalogSnapshot, Exoplanet } from "@/domain/exoplanets/model";
import { snapshotSchema } from "@/lib/validation/snapshot";
import {
    type BoundedField,
    createNormalizationIssues,
    normalizeArchiveRow
} from "@/services/exoplanet-archive/normalize";
import { archiveSource } from "@/services/exoplanet-archive/query";
import { archiveResponseSchema, archiveRowSchema } from "@/services/exoplanet-archive/raw-schema";

export interface SnapshotBuildReport {
    receivedRows: number;
    rejectedRows: number;
    rejectedColumns: Record<string, number>;
    discardedValues: Partial<Record<BoundedField, number>>;
    unknownMethods: string[];
}

export interface SnapshotBuild {
    snapshot: CatalogSnapshot;
    report: SnapshotBuildReport;
}

export function buildSnapshot(response: unknown, retrievedAt: Date): SnapshotBuild {
    const rows = archiveResponseSchema.parse(response);
    const issues = createNormalizationIssues();
    const rejectedColumns: Record<string, number> = {};
    const planets: Exoplanet[] = [];

    for (const row of rows) {
        const result = archiveRowSchema.safeParse(row);
        if (result.success) {
            planets.push(normalizeArchiveRow(result.data, issues));
            continue;
        }
        const column = String(result.error.issues[0]?.path[0] ?? "ligne");
        rejectedColumns[column] = (rejectedColumns[column] ?? 0) + 1;
    }

    const snapshot = snapshotSchema.parse({
        schemaVersion: 1,
        source: { name: archiveSource.name, table: archiveSource.table, url: archiveSource.url },
        retrievedAt: retrievedAt.toISOString(),
        planets
    });

    return {
        snapshot,
        report: {
            receivedRows: rows.length,
            rejectedRows: rows.length - planets.length,
            rejectedColumns,
            discardedValues: issues.discardedValues,
            unknownMethods: [...issues.unknownMethods].sort()
        }
    };
}

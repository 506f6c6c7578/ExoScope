import { archiveSource } from "@/services/exoplanet-archive/query";

export function getArchiveOverviewUrl(name: string): string {
    return new URL(`/overview/${encodeURIComponent(name)}`, archiveSource.url).href;
}

export const archiveDocumentationUrl = new URL("/docs/pscp_about.html", archiveSource.url).href;

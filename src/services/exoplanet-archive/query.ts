export const archiveSource = {
    name: "NASA Exoplanet Archive",
    table: "pscomppars",
    url: "https://exoplanetarchive.ipac.caltech.edu"
} as const;

export const archiveEndpoint = new URL("/TAP/sync", archiveSource.url);

export const archiveColumns = [
    "pl_name",
    "hostname",
    "sy_pnum",
    "discoverymethod",
    "disc_year",
    "disc_facility",
    "sy_dist",
    "pl_bmassj",
    "pl_bmassjlim",
    "pl_bmassprov",
    "pl_bmassj_reflink",
    "pl_radj",
    "pl_radjlim",
    "pl_radj_reflink",
    "pl_orbper",
    "pl_orbperlim",
    "pl_orbper_reflink",
    "pl_orbsmax",
    "pl_orbsmaxlim",
    "pl_orbsmax_reflink",
    "pl_orbeccen",
    "pl_orbeccenlim",
    "pl_orbeccen_reflink",
    "pl_eqt",
    "pl_eqtlim",
    "pl_eqt_reflink",
    "st_teff",
    "st_rad",
    "ra",
    "dec",
    "pl_controv_flag"
] as const;

export type ArchiveColumn = (typeof archiveColumns)[number];

export const catalogQuery = `select ${archiveColumns.join(",")} from ${archiveSource.table} order by pl_name`;

export function createArchiveRequestUrl(): URL {
    const url = new URL(archiveEndpoint);
    url.searchParams.set("query", catalogQuery);
    url.searchParams.set("format", "json");
    return url;
}

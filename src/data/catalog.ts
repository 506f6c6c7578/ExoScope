import serializedSnapshot from "@/data/generated/exoplanets.json?raw";
import { sampleScatter } from "@/domain/charts/scatter";
import { createCatalog } from "@/domain/exoplanets/catalog";
import { getCatalogStatistics } from "@/domain/exoplanets/statistics";
import { computeRangeBounds } from "@/domain/filters/scale";
import { parseSnapshot } from "@/lib/validation/snapshot";

export const catalog = createCatalog(parseSnapshot(serializedSnapshot));

export const catalogStatistics = getCatalogStatistics(catalog.snapshot.planets);

export const catalogRangeBounds = computeRangeBounds(catalog.entries);

export const scatterBackgrounds = {
    massRadius: sampleScatter(catalog.snapshot.planets, "massRadius"),
    orbit: sampleScatter(catalog.snapshot.planets, "orbit")
};

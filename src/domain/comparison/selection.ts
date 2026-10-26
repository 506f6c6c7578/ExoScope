import { isSlug, maxSlugLength } from "@/domain/exoplanets/text";

export const comparisonLimits = { min: 2, max: 4 } as const;

export const comparisonParameter = "planetes";

export type ComparisonSelection = { success: true; slugs: string[] } | { success: false; error: string };

export function parseComparisonSlugs(value: string | null): ComparisonSelection {
    if (value === null || value.trim() === "") return { success: true, slugs: [] };
    if (value.length > comparisonLimits.max * (maxSlugLength + 1)) {
        return { success: false, error: "La liste de planètes est trop longue." };
    }
    const slugs = [...new Set(value.split(",").map((slug) => slug.trim()).filter(Boolean))];
    if (slugs.length > comparisonLimits.max) {
        return { success: false, error: `Tu peux comparer au maximum ${comparisonLimits.max} planètes.` };
    }
    if (!slugs.every(isSlug)) return { success: false, error: "Un identifiant de planète est invalide." };
    return { success: true, slugs };
}

export function serializeComparison(slugs: readonly string[]): string {
    return slugs.join(",");
}

export function toggleSelection(slugs: readonly string[], slug: string): string[] {
    if (slugs.includes(slug)) return slugs.filter((current) => current !== slug);
    return slugs.length >= comparisonLimits.max ? [...slugs] : [...slugs, slug];
}

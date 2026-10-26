export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const maxSlugLength = 80;

export function normalizeSearchText(value: string): string {
    return value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLocaleLowerCase("fr")
        .replace(/\s+/g, " ")
        .trim();
}

export function toSearchKey(value: string): string {
    return normalizeSearchText(value).replace(/[^a-z0-9]/g, "");
}

export function createSlug(name: string): string {
    return normalizeSearchText(name)
        .replaceAll("+", " plus ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function isSlug(value: string): boolean {
    return value.length <= maxSlugLength && slugPattern.test(value);
}

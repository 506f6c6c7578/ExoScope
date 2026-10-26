import * as z from "zod/mini";

const printableText = /^\P{Cc}*$/u;

export function printableTextSchema(maxLength: number) {
    return z.string().check(z.trim(), z.minLength(1), z.maxLength(maxLength), z.regex(printableText));
}

export const searchTextLimits = { min: 2, max: 100 } as const;

export const searchTextSchema = z.string().check(
    z.trim(),
    z.minLength(searchTextLimits.min, { error: `Saisis au moins ${searchTextLimits.min} caractères.` }),
    z.maxLength(searchTextLimits.max, { error: `La recherche ne doit pas dépasser ${searchTextLimits.max} caractères.` }),
    z.regex(printableText, { error: "La recherche contient des caractères non autorisés." })
);

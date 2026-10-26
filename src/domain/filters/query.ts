import * as z from "zod/mini";
import { type DiscoveryMethod, discoveryMethods } from "@/domain/exoplanets/model";
import { getRangeProperty, type RangeFilterKey, rangeFilterKeys, type SortKey, sortKeys, type SortOrder, sortOrders } from "@/domain/filters/fields";
import { printableTextSchema, searchTextLimits } from "@/lib/validation/text";

export interface NumericRange {
    min: number | null;
    max: number | null;
}

export type RangeSelection = Partial<Record<RangeFilterKey, NumericRange>>;

export interface CatalogQuery {
    text: string;
    host: string;
    methods: DiscoveryMethod[];
    ranges: RangeSelection;
    measuredOnly: boolean;
    sort: SortKey;
    order: SortOrder;
    page: number;
    pageSize: PageSize;
}

export type CatalogQueryResult = { success: true; query: CatalogQuery } | { success: false; error: string };

export const pageSizes = [10, 25, 50] as const;

export type PageSize = (typeof pageSizes)[number];

export function isPageSize(value: number): value is PageSize {
    return pageSizes.some((size) => size === value);
}

export const catalogLimits = {
    maxPage: 1_000,
    maxParameters: 32,
    maxQueryLength: 2_048
} as const;

export const queryParameters = {
    text: "q",
    host: "etoile",
    methods: "methode",
    measuredOnly: "mesurees",
    sort: "tri",
    order: "ordre",
    page: "page",
    pageSize: "taille"
} as const;

export const defaultCatalogQuery: CatalogQuery = {
    text: "",
    host: "",
    methods: [],
    ranges: {},
    measuredOnly: false,
    sort: "annee",
    order: "desc",
    page: 1,
    pageSize: 25
};

const decimalPattern = /^\d{1,10}(?:\.\d{1,6})?$/;

const decimalParameter = z.optional(z.pipe(
    z.string().check(z.trim(), z.regex(decimalPattern, { error: "Valeur numérique invalide." })),
    z.transform(Number)
));

const methodsParameter = z.pipe(
    z.pipe(z.string().check(z.maxLength(400)), z.transform((value) => value.split(","))),
    z.array(z.enum(discoveryMethods, { error: "Méthode de découverte inconnue." }))
);

const pageParameter = z.pipe(
    z.pipe(z.string().check(z.regex(/^\d{1,4}$/, { error: "Page invalide." })), z.transform(Number)),
    z.number().check(z.gte(1), z.lte(catalogLimits.maxPage, { error: "Page trop élevée." }))
);

const pageSizeParameter = z.pipe(
    z.pipe(z.string().check(z.regex(/^\d{1,3}$/,{ error: "Taille de page invalide." })), z.transform(Number)),
    z.custom<PageSize>((value) => typeof value === "number" && isPageSize(value), { error: "Taille de page non autorisée." })
);

const baseSchema = z.object({
    [queryParameters.text]: z.optional(printableTextSchema(searchTextLimits.max)),
    [queryParameters.host]: z.optional(printableTextSchema(searchTextLimits.max)),
    [queryParameters.methods]: z.optional(methodsParameter),
    [queryParameters.measuredOnly]: z.optional(z.literal("1", { error: "Valeur invalide pour les données mesurées." })),
    [queryParameters.sort]: z.optional(z.enum(sortKeys, { error: "Tri non autorisé." })),
    [queryParameters.order]: z.optional(z.enum(sortOrders, { error: "Ordre de tri invalide." })),
    [queryParameters.page]: z.optional(pageParameter),
    [queryParameters.pageSize]: z.optional(pageSizeParameter)
});

export function getRangeParameter(key: RangeFilterKey, bound: keyof NumericRange): string {
    return `${key}-${bound}`;
}

const rangeSchema = z.object(Object.fromEntries(rangeFilterKeys.flatMap((key) => [
    [getRangeParameter(key, "min"), decimalParameter],
    [getRangeParameter(key, "max"), decimalParameter]
])));

function readFirstValues(parameters: URLSearchParams): Record<string, string> {
    const values: Record<string, string> = {};
    for (const [key, value] of parameters) {
        if (!(key in values) && value.trim() !== "") values[key] = value;
    }
    return values;
}

function buildRanges(values: Record<string, number | undefined>): RangeSelection | string {
    const ranges: RangeSelection = {};
    for (const key of rangeFilterKeys) {
        const min = values[getRangeParameter(key, "min")] ?? null;
        const max = values[getRangeParameter(key, "max")] ?? null;
        if (min === null && max === null) continue;
        if (min !== null && max !== null && min > max) {
            return `${getRangeProperty(key).label} : la valeur minimale dépasse la valeur maximale.`;
        }
        ranges[key] = { min, max };
    }
    return ranges;
}

function failure(error: string): CatalogQueryResult {
    return { success: false, error };
}

export function parseCatalogQuery(parameters: URLSearchParams): CatalogQueryResult {
    if (parameters.size > catalogLimits.maxParameters || parameters.toString().length > catalogLimits.maxQueryLength) {
        return failure("La requête contient trop de paramètres.");
    }

    const values = readFirstValues(parameters);
    const base = baseSchema.safeParse(values);
    if (!base.success) return failure(base.error.issues[0]?.message ?? "Paramètres invalides.");
    const range = rangeSchema.safeParse(values);
    if (!range.success) return failure(range.error.issues[0]?.message ?? "Paramètres invalides.");

    const ranges = buildRanges(range.data);
    if (typeof ranges === "string") return failure(ranges);

    const { data } = base;
    return {
        success: true,
        query: {
            text: data[queryParameters.text] ?? defaultCatalogQuery.text,
            host: data[queryParameters.host] ?? defaultCatalogQuery.host,
            methods: discoveryMethods.filter((method) => data[queryParameters.methods]?.includes(method)),
            ranges,
            measuredOnly: data[queryParameters.measuredOnly] === "1",
            sort: data[queryParameters.sort] ?? defaultCatalogQuery.sort,
            order: data[queryParameters.order] ?? defaultCatalogQuery.order,
            page: data[queryParameters.page] ?? defaultCatalogQuery.page,
            pageSize: data[queryParameters.pageSize] ?? defaultCatalogQuery.pageSize
        }
    };
}

export function formatParameterNumber(value: number): string {
    return value.toFixed(6).replace(/\.?0+$/, "");
}

export function serializeCatalogQuery(query: CatalogQuery): URLSearchParams {
    const parameters = new URLSearchParams();
    if (query.text) parameters.set(queryParameters.text, query.text);
    if (query.host) parameters.set(queryParameters.host, query.host);
    if (query.methods.length > 0) parameters.set(queryParameters.methods, query.methods.join(","));
    for (const key of rangeFilterKeys) {
        const range = query.ranges[key];
        if (range?.min != null) parameters.set(getRangeParameter(key, "min"), formatParameterNumber(range.min));
        if (range?.max != null) parameters.set(getRangeParameter(key, "max"), formatParameterNumber(range.max));
    }
    if (query.measuredOnly) parameters.set(queryParameters.measuredOnly, "1");
    if (query.sort !== defaultCatalogQuery.sort) parameters.set(queryParameters.sort, query.sort);
    if (query.order !== defaultCatalogQuery.order) parameters.set(queryParameters.order, query.order);
    if (query.page !== defaultCatalogQuery.page) parameters.set(queryParameters.page, String(query.page));
    if (query.pageSize !== defaultCatalogQuery.pageSize) parameters.set(queryParameters.pageSize, String(query.pageSize));
    return parameters;
}

export function countActiveFilters(query: CatalogQuery): number {
    return [
        query.text !== "",
        query.host !== "",
        query.methods.length > 0,
        query.measuredOnly,
        ...rangeFilterKeys.map((key) => query.ranges[key] !== undefined)
    ].filter(Boolean).length;
}

export function withRange(ranges: RangeSelection, key: RangeFilterKey, range: NumericRange | undefined): RangeSelection {
    const next: RangeSelection = { ...ranges };
    delete next[key];
    if (range) next[key] = range;
    return next;
}

export function clearFilters({ sort, order, pageSize }: CatalogQuery): CatalogQuery {
    return { ...defaultCatalogQuery, sort, order, pageSize };
}

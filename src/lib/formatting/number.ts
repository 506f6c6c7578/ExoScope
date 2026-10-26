import type { QuantityFormat } from "@/domain/exoplanets/properties";

const locale = "fr-FR";
export const unitSpace = "\u00a0";

const integerFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
const significantFormatter = new Intl.NumberFormat(locale, { maximumSignificantDigits: 3 });
const ratioFormatter = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 3 });
const percentFormatter = new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 });
const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" });

export function formatInteger(value: number): string {
    return integerFormatter.format(value);
}

export function formatSignificant(value: number): string {
    return Math.abs(value) >= 1_000 ? integerFormatter.format(value) : significantFormatter.format(value);
}

const formatters: Record<QuantityFormat, (value: number) => string> = {
    year: String,
    integer: formatInteger,
    significant: formatSignificant,
    ratio: (value) => ratioFormatter.format(value)
};

export function formatQuantity(value: number, format: QuantityFormat, unit: string | null): string {
    const number = formatters[format](value);
    return unit ? `${number}${unitSpace}${unit}` : number;
}

export function formatPercent(ratio: number): string {
    return percentFormatter.format(ratio);
}

export function formatCount(count: number, singular: string, plural = `${singular}s`): string {
    return `${formatInteger(count)}${unitSpace}${count > 1 ? plural : singular}`;
}

export function formatDate(isoDate: string): string {
    return dateFormatter.format(new Date(isoDate));
}

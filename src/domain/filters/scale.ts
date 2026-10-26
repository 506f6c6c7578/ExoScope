import type { IndexedPlanet } from "@/domain/exoplanets/catalog";
import { getRangeProperty, type RangeFilterKey, rangeFilterKeys, rangeFilters, type RangeScale } from "@/domain/filters/fields";

export interface RangeBounds {
    min: number;
    max: number;
    scale: RangeScale;
}

export type RangeBoundsByFilter = Record<RangeFilterKey, RangeBounds>;

export const sliderResolution = 1_000;

function roundToSignificant(value: number, digits = 3): number {
    return Number(value.toPrecision(digits));
}

function niceBounds(min: number, max: number, scale: RangeScale): RangeBounds {
    if (scale === "linear") return { min: Math.floor(min), max: Math.ceil(max), scale };
    return { min: 10 ** Math.floor(Math.log10(min)), max: 10 ** Math.ceil(Math.log10(max)), scale };
}

export function computeRangeBounds(entries: readonly IndexedPlanet[]): RangeBoundsByFilter {
    return Object.fromEntries(rangeFilterKeys.map((key) => {
        const { read } = getRangeProperty(key);
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        for (const { planet } of entries) {
            const value = read(planet);
            if (value === null) continue;
            min = Math.min(min, value);
            max = Math.max(max, value);
        }
        return [key, niceBounds(min, max, rangeFilters[key].scale)];
    })) as RangeBoundsByFilter;
}

export function toSliderPosition(value: number, { min, max, scale }: RangeBounds): number {
    const clamped = Math.min(Math.max(value, min), max);
    const ratio = scale === "log"
        ? (Math.log10(clamped) - Math.log10(min)) / (Math.log10(max) - Math.log10(min))
        : (clamped - min) / (max - min);
    return Math.round(ratio * sliderResolution);
}

export function fromSliderPosition(position: number, { min, max, scale }: RangeBounds): number {
    const ratio = Math.min(Math.max(position, 0), sliderResolution) / sliderResolution;
    if (scale === "linear") return Math.round(min + ratio * (max - min));
    return roundToSignificant(10 ** (Math.log10(min) + ratio * (Math.log10(max) - Math.log10(min))));
}

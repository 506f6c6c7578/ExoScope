import { useEffect, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { getRangeProperty, type RangeFilterKey } from "@/domain/filters/fields";
import type { NumericRange } from "@/domain/filters/query";
import { fromSliderPosition, type RangeBounds, sliderResolution, toSliderPosition } from "@/domain/filters/scale";
import { formatQuantity } from "@/lib/formatting/number";

interface RangeFilterProps {
    filter: RangeFilterKey;
    bounds: RangeBounds;
    range: NumericRange | undefined;
    onChange: (range: NumericRange | undefined) => void;
}

function toPositions(range: NumericRange | undefined, bounds: RangeBounds): number[] {
    return [
        range?.min == null ? 0 : toSliderPosition(range.min, bounds),
        range?.max == null ? sliderResolution : toSliderPosition(range.max, bounds)
    ];
}

export function RangeFilter({ filter, bounds, range, onChange }: RangeFilterProps) {
    const property = getRangeProperty(filter);
    const [positions, setPositions] = useState(() => toPositions(range, bounds));
    const labelId = `filtre-${filter}`;

    useEffect(() => setPositions(toPositions(range, bounds)), [range, bounds]);

    const format = (position: number) => formatQuantity(fromSliderPosition(position, bounds), property.format, property.unit);
    const [start = 0, end = sliderResolution] = positions;
    const isFull = start === 0 && end === sliderResolution;

    const commit = ([first = 0, last = sliderResolution]: number[]) => {
        if (first === 0 && last === sliderResolution) {
            onChange(undefined);
            return;
        }
        onChange({
            min: first === 0 ? null : fromSliderPosition(first, bounds),
            max: last === sliderResolution ? null : fromSliderPosition(last, bounds)
        });
    };

    return (
        <div className="grid gap-3" role="group" aria-labelledby={labelId}>
            <div className="flex items-baseline justify-between gap-3">
                <span id={labelId} className="text-sm font-semibold text-foreground">{property.label}</span>
                <span className="text-right text-xs text-muted-foreground tabular-nums" aria-live="polite">
                    {isFull ? "Toutes les valeurs" : `${format(start)} – ${format(end)}`}
                </span>
            </div>
            <Slider
                min={0}
                max={sliderResolution}
                step={1}
                minStepsBetweenThumbs={1}
                value={positions}
                onValueChange={setPositions}
                onValueCommit={commit}
                thumbLabels={[`${property.label} : borne inférieure`, `${property.label} : borne supérieure`]}
                getValueText={format}
            />
        </div>
    );
}

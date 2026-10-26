import { cn } from "cn";
import { type FormattedMeasurement, originAbbreviations, originLabels } from "@/lib/formatting/measurement";

interface MeasurementProps {
    measurement: FormattedMeasurement;
    compact?: boolean;
    className?: string;
}

export function Measurement({ measurement: { text, origin, known }, compact = false, className }: MeasurementProps) {
    if (!known) return <span className={cn("text-muted-foreground", className)}>{text}</span>;
    return (
        <span className={cn("tabular-nums", className)}>
            {text}
            {origin && (compact ? (
                <>
                    <span className="ml-1 text-xs font-normal text-muted-foreground" aria-hidden="true">{originAbbreviations[origin]}</span>
                    <span className="sr-only">, {originLabels[origin]}</span>
                </>
            ) : <span className="ml-1.5 text-xs font-normal text-muted-foreground">{originLabels[origin]}</span>)}
        </span>
    );
}

export const provenanceLegend = "≥ min. : masse minimale (M sin i) · ≈ est. : estimée par relation masse-rayon · calc. : calculée · lim. : limite publiée (≤ supérieure, ≥ inférieure)";

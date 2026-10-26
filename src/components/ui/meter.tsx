const barProps = {
    y1: 3,
    y2: 3,
    strokeWidth: 6,
    strokeLinecap: "round",
    vectorEffect: "non-scaling-stroke"
} as const;

export function Meter({ value }: { value: number }) {
    return (
        <svg className="h-1.5 w-full overflow-visible px-0.75" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true">
            <line className="stroke-brand-soft" x2={100} {...barProps}/>
            {value > 0 && (
                <line className="origin-left animate-grow-x stroke-chart-brand [transform-box:fill-box]" x2={value * 100} {...barProps}/>
            )}
        </svg>
    );
}

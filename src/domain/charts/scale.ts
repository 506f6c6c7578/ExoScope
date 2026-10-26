export function niceStep(maximum: number, targetTicks: number): number {
    const rough = maximum / targetTicks;
    const magnitude = 10 ** Math.floor(Math.log10(rough));
    const normalized = rough / magnitude;
    const factor = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    return factor * magnitude;
}

export function linearTicks(maximum: number, targetTicks: number): { max: number; ticks: number[] } {
    const step = niceStep(Math.max(maximum, 1), targetTicks);
    const max = Math.ceil(Math.max(maximum, 1) / step) * step;
    return { max, ticks: Array.from({ length: Math.round(max / step) + 1 }, (_, index) => index * step) };
}

export function logPosition(value: number, min: number, max: number): number {
    return (Math.log10(value) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
}

export function decadeTicks(min: number, max: number): number[] {
    const first = Math.ceil(Math.log10(min));
    const last = Math.floor(Math.log10(max));
    return Array.from({ length: last - first + 1 }, (_, index) => 10 ** (first + index));
}

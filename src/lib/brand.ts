export const brandColors = {
    primary: "#121212",
    body: "#ffffff",
    darkBody: "#1c1c1c",
    accent: "#5b3fd6"
} as const;

export function createLogoMark(foreground: string, background: string): string {
    return `<circle cx="32" cy="32" r="5.5" fill="${foreground}"/><ellipse cx="32" cy="32" rx="20" ry="9" transform="rotate(-20 32 32)" fill="none" stroke="${foreground}" stroke-width="3.5"/><circle cx="41.1" cy="21.4" r="5.5" fill="${foreground}" stroke="${background}" stroke-width="3"/>`;
}

export function createLogoSvg(size: number): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${brandColors.primary}"/>${createLogoMark(brandColors.body, brandColors.primary)}</svg>`;
}

export interface Page<Item> {
    items: Item[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export function paginate<Item>(items: readonly Item[], page: number, pageSize: number): Page<Item> {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    const current = Math.min(Math.max(1, page), totalPages);
    const start = (current - 1) * pageSize;
    return {
        items: items.slice(start, start + pageSize),
        page: current,
        pageSize,
        total: items.length,
        totalPages
    };
}

export type PageLink = { kind: "page"; page: number } | { kind: "gap"; key: string };

export function getPageLinks(page: number, totalPages: number, siblings = 1): PageLink[] {
    const pages = new Set([1, totalPages]);
    for (let offset = -siblings; offset <= siblings; offset += 1) {
        const candidate = page + offset;
        if (candidate >= 1 && candidate <= totalPages) pages.add(candidate);
    }
    const sorted = [...pages].sort((first, second) => first - second);
    return sorted.flatMap((current, index): PageLink[] => {
        const previous = sorted[index - 1];
        const link: PageLink = { kind: "page", page: current };
        return previous !== undefined && current - previous > 1 ? [{ kind: "gap", key: `gap-${current}` }, link] : [link];
    });
}

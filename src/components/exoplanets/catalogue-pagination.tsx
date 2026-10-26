import type { MouseEvent } from "react";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination";
import { getPageLinks } from "@/domain/filters/pagination";

interface CataloguePaginationProps {
    page: number;
    totalPages: number;
    getHref: (page: number) => string;
    onNavigate?: (page: number) => void;
}

export function CataloguePagination({ page, totalPages, getHref, onNavigate }: CataloguePaginationProps) {
    if (totalPages <= 1) return null;

    const linkProps = (target: number) => ({
        href: getHref(target),
        onClick: (event: MouseEvent<HTMLAnchorElement>) => {
            if (!onNavigate || event.metaKey || event.ctrlKey || event.shiftKey) return;
            event.preventDefault();
            onNavigate(target);
        }
    });

    return (
        <Pagination aria-label="Pages du catalogue">
            <PaginationContent className="flex-wrap justify-center">
                {page > 1 && <PaginationItem><PaginationPrevious {...linkProps(page - 1)}/></PaginationItem>}
                {getPageLinks(page, totalPages).map((link) => (
                    <PaginationItem key={link.kind === "page" ? link.page : link.key}>
                        {link.kind === "page" ? (
                            <PaginationLink {...linkProps(link.page)} isActive={link.page === page} aria-label={`Page ${link.page}`}>
                                {link.page}
                            </PaginationLink>
                        ) : <PaginationEllipsis/>}
                    </PaginationItem>
                ))}
                {page < totalPages && <PaginationItem><PaginationNext {...linkProps(page + 1)}/></PaginationItem>}
            </PaginationContent>
        </Pagination>
    );
}

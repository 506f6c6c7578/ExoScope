import { ChevronDown } from "lucide-react";
import { type ComponentProps, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useCloseOnScroll } from "@/hooks/use-close-on-scroll";
import { cn } from "cn";

type OptionValue = string | number;

export interface SelectMenuOption<Value extends OptionValue> {
    value: Value;
    label: string;
}

interface SelectMenuProps<Value extends OptionValue> extends Omit<ComponentProps<typeof Button>, "value" | "children" | "asChild"> {
    value: Value;
    options: readonly SelectMenuOption<Value>[];
    onValueChange: (value: Value) => void;
}

function revealSelectedItem(item: HTMLElement | null) {
    const menu = item?.closest<HTMLElement>("[role='menu']");
    if (!item || !menu) return;
    item.focus({ preventScroll: true });
    menu.scrollTop = item.offsetTop - (menu.clientHeight - item.offsetHeight) / 2;
}

function preserveMovedFocus(event: Event) {
    if (document.activeElement && document.activeElement !== document.body) event.preventDefault();
}

export function SelectMenu<Value extends OptionValue>({ value, options, onValueChange, className, ...props }: SelectMenuProps<Value>) {
    const [open, setOpen] = useState(false);
    useCloseOnScroll(open, setOpen);

    const select = (next: string) => {
        const option = options.find((candidate) => String(candidate.value) === next);
        if (option) onValueChange(option.value);
    };

    return (
        <DropdownMenu modal={false} open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className={cn("justify-between", className)} {...props}>
                    <span className="truncate">{options.find((option) => option.value === value)?.label}</span>
                    <ChevronDown aria-hidden="true"
                                 className="text-muted-foreground transition-transform duration-200 group-aria-expanded/button:rotate-180"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent onCloseAutoFocus={preserveMovedFocus}
                                 className="relative max-h-[min(18rem,var(--radix-dropdown-menu-content-available-height,18rem))]">
                <DropdownMenuRadioGroup value={String(value)} onValueChange={select}>
                    {options.map((option) => (
                        <DropdownMenuRadioItem key={option.value} value={String(option.value)}
                                               ref={option.value === value ? revealSelectedItem : undefined}>
                            {option.label}
                        </DropdownMenuRadioItem>
                    ))}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

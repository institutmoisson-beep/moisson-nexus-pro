import { ReactNode, useMemo, useState } from "react";
import { Search, CalendarRange, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface SearchableHistorySectionProps<T> {
  title?: string;
  subtitle?: string;
  items: T[];
  emptyText: string;
  searchPlaceholder?: string;
  getSearchText: (item: T) => string;
  getDateValue: (item: T) => string | null | undefined;
  renderResults: (items: T[]) => ReactNode;
  extraFilters?: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

const SearchableHistorySection = <T,>({
  title,
  subtitle,
  items,
  emptyText,
  searchPlaceholder = "Rechercher…",
  getSearchText,
  getDateValue,
  renderResults,
  extraFilters,
  defaultOpen = true,
  className,
}: SearchableHistorySectionProps<T>) => {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const hasActiveFilters = query.trim().length > 0 || !!dateFrom || !!dateTo;

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const searchableText = getSearchText(item).toLowerCase();
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);

      const rawDate = getDateValue(item);
      const itemDate = rawDate ? new Date(rawDate) : null;
      const itemTime = itemDate && !Number.isNaN(itemDate.getTime()) ? itemDate.getTime() : null;

      const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
      const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

      const matchesFrom = fromTime === null || (itemTime !== null && itemTime >= fromTime);
      const matchesTo = toTime === null || (itemTime !== null && itemTime <= toTime);

      return matchesQuery && matchesFrom && matchesTo;
    });
  }, [items, query, dateFrom, dateTo, getSearchText, getDateValue]);

  const resetFilters = () => {
    setQuery("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("space-y-4", className)}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          {title && <h2 className="text-lg font-heading font-semibold text-foreground">{title}</h2>}
          {subtitle && <p className="text-sm text-muted-foreground font-body">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="font-body">
            {filteredItems.length} / {items.length}
          </Badge>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="font-body">
              {open ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
              {open ? "Replier" : "Déplier"}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative md:col-span-2 xl:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>

          <div className="relative">
            <CalendarRange className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="pl-9" />
          </div>

          <div className="relative">
            <CalendarRange className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="pl-9" />
          </div>

          {extraFilters && <div className="md:col-span-2 xl:col-span-4">{extraFilters}</div>}

          {hasActiveFilters && (
            <div className="md:col-span-2 xl:col-span-4 flex justify-end">
              <Button variant="ghost" size="sm" onClick={resetFilters} className="font-body">
                <RotateCcw className="w-4 h-4 mr-2" />
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <div className="rounded-lg border border-border bg-secondary/30 px-4 py-8 text-center text-muted-foreground font-body">
            {emptyText}
          </div>
        ) : (
          renderResults(filteredItems)
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SearchableHistorySection;
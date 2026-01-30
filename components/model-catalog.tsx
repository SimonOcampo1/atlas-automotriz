"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SpecCardGrid, type SpecCardItem } from "@/components/spec-card-grid";

type SortOption = "name-asc" | "name-desc" | "year-asc" | "year-desc";

type Props = {
  items: SpecCardItem[];
  emptyLabel?: string;
};

function getStartYear(value: string) {
  const match = value.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

export function ModelCatalog({ items, emptyLabel }: Props) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortOption>("name-asc");

  const filtered = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const base = items.filter((item) => {
      if (!normalizedQuery) {
        return true;
      }
      return (
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.years.toLowerCase().includes(normalizedQuery)
      );
    });

    const sorted = [...base];
    sorted.sort((a, b) => {
      if (sort === "name-asc") {
        return a.title.localeCompare(b.title);
      }
      if (sort === "name-desc") {
        return b.title.localeCompare(a.title);
      }
      const aYear = getStartYear(a.years);
      const bYear = getStartYear(b.years);
      if (sort === "year-asc") {
        const aValue = aYear ?? Number.POSITIVE_INFINITY;
        const bValue = bYear ?? Number.POSITIVE_INFINITY;
        if (aValue !== bValue) {
          return aValue - bValue;
        }
        return a.title.localeCompare(b.title);
      }
      const aValue = aYear ?? Number.NEGATIVE_INFINITY;
      const bValue = bYear ?? Number.NEGATIVE_INFINITY;
      if (aValue !== bValue) {
        return bValue - aValue;
      }
      return a.title.localeCompare(b.title);
    });

    return sorted;
  }, [items, query, sort]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar modelo..."
          className="sm:max-w-xs"
        />
        <Select value={sort} onValueChange={(value) => setSort(value as SortOption)}>
          <SelectTrigger className="sm:max-w-xs">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">A–Z</SelectItem>
            <SelectItem value="name-desc">Z–A</SelectItem>
            <SelectItem value="year-asc">Año: más antiguo</SelectItem>
            <SelectItem value="year-desc">Año: más reciente</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="w-fit">
          {filtered.length} resultados
        </Badge>
      </div>

      <SpecCardGrid items={filtered} emptyLabel={emptyLabel} />
    </section>
  );
}

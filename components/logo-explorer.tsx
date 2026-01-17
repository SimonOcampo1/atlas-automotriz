"use client";

import * as React from "react";
import Link from "next/link";
import type { Logo, LogoSize } from "@/lib/logos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownAZ, ArrowUpAZ } from "lucide-react";
import {
  COUNTRIES,
  COUNTRY_BY_CODE,
  UNKNOWN_COUNTRY,
} from "@/lib/country-data";
import { BRAND_COUNTRY_BY_SLUG } from "@/lib/brand-country-map";

type SortOption = "name-asc" | "name-desc";

type DensityOption = 2 | 3 | 4 | 5 | 6;
type VisualSizeOption = "small" | "medium" | "large";
type GroupMode = "letters" | "countries";

type Props = {
  logos: Logo[];
  brandModelLinks?: Record<string, string>;
};

function getImageSrc(logo: Logo, size: LogoSize) {
  return `/api/logo/${logo.images[size]}`;
}

function getSizeClasses(scale: number) {
  if (scale <= 1) {
    return { container: "h-16", image: "max-h-8" };
  }
  if (scale === 2) {
    return { container: "h-24", image: "max-h-12" };
  }
  return { container: "h-32", image: "max-h-16" };
}

export function LogoExplorer({ logos, brandModelLinks }: Props) {
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortOption>("name-asc");
  const [size, setSize] = React.useState<LogoSize>("optimized");
  const [density, setDensity] = React.useState<DensityOption>(4);
  const [visualSize, setVisualSize] = React.useState<VisualSizeOption>("medium");
  const [selected, setSelected] = React.useState<Logo | null>(null);
  const [effectiveColumns, setEffectiveColumns] = React.useState<number>(density);
  const [groupMode, setGroupMode] = React.useState<GroupMode>("letters");
  const [countryFilter, setCountryFilter] = React.useState("all");

  React.useEffect(() => {
    function handleResize() {
      const width = window.innerWidth;
      if (width < 640) {
        setEffectiveColumns(2);
        return;
      }
      if (width < 768) {
        setEffectiveColumns(Math.min(density, 3));
        return;
      }
      if (width < 1024) {
        setEffectiveColumns(Math.min(density, 4));
        return;
      }
      setEffectiveColumns(density);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [density]);

  const filtered = React.useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const base = logos.filter((logo) => {
      if (!normalizedQuery) {
        return true;
      }
      return (
        logo.name.toLowerCase().includes(normalizedQuery) ||
        logo.slug.toLowerCase().includes(normalizedQuery)
      );
    });

    const sorted = [...base];
    sorted.sort((a, b) => {
      switch (sort) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return sorted;
  }, [logos, query, sort]);

  const filteredByCountry = React.useMemo(() => {
    if (countryFilter === "all") {
      return filtered;
    }

    return filtered.filter((logo) => {
      const mapped = BRAND_COUNTRY_BY_SLUG[logo.slug];
      const code = mapped && mapped.trim() ? mapped : UNKNOWN_COUNTRY.code;
      const info = COUNTRY_BY_CODE[code] ?? UNKNOWN_COUNTRY;

      if (countryFilter === "unknown") {
        return info.code === UNKNOWN_COUNTRY.code;
      }

      if (countryFilter.startsWith("region:")) {
        const region = countryFilter.replace("region:", "");
        return info.region === region;
      }

      return info.code === countryFilter;
    });
  }, [filtered, countryFilter]);

  const countryOptions = React.useMemo(() => {
    const usedCodes = new Set(
      Object.values(BRAND_COUNTRY_BY_SLUG)
        .map((code) => code.trim())
        .filter(Boolean)
        .map((code) => code.toUpperCase())
    );

    const filteredCountries = usedCodes.size
      ? COUNTRIES.filter((country) => usedCodes.has(country.code.toUpperCase()))
      : COUNTRIES;

    return [...filteredCountries].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const regionOptions = React.useMemo(() => {
    const regions = Array.from(new Set(countryOptions.map((country) => country.region)));
    return regions.sort();
  }, [countryOptions]);

  const countryFilterLabel = React.useMemo(() => {
    if (countryFilter === "all") {
      return "Todos los países";
    }
    if (countryFilter === "unknown") {
      return "Sin país";
    }
    if (countryFilter.startsWith("region:")) {
      return countryFilter.replace("region:", "");
    }
    const info = COUNTRY_BY_CODE[countryFilter];
    return info ? info.name : countryFilter;
  }, [countryFilter]);

  const countryFilterFlag = React.useMemo(() => {
    if (
      countryFilter === "all" ||
      countryFilter === "unknown" ||
      countryFilter.startsWith("region:")
    ) {
      return null;
    }
    return COUNTRY_BY_CODE[countryFilter] ? countryFilter : null;
  }, [countryFilter]);

  const groupedLogos = React.useMemo(() => {
    const groups = new Map<string, Logo[]>();

    if (groupMode === "letters") {
      for (const logo of filteredByCountry) {
        const first = logo.name.trim().charAt(0).toUpperCase();
        const key = first.match(/[A-Z]/) ? first : "#";
        const bucket = groups.get(key);
        if (bucket) {
          bucket.push(logo);
        } else {
          groups.set(key, [logo]);
        }
      }

      const keys = Array.from(groups.keys());
      const letters = keys.filter((key) => key !== "#").sort();
      if (sort === "name-desc") {
        letters.reverse();
      }
      const orderedKeys = [...letters, "#"].filter((key) => groups.has(key));
      return orderedKeys.map((key) => ({
        key,
        title: key,
        country: undefined,
        logos: groups.get(key)!,
      }));
    }

    for (const logo of filteredByCountry) {
      const code = BRAND_COUNTRY_BY_SLUG[logo.slug] ?? UNKNOWN_COUNTRY.code;
      const bucket = groups.get(code);
      if (bucket) {
        bucket.push(logo);
      } else {
        groups.set(code, [logo]);
      }
    }

    const items = Array.from(groups.entries()).map(([code, logos]) => {
      const country = COUNTRY_BY_CODE[code] ?? UNKNOWN_COUNTRY;
      return {
        key: code,
        title: country.name,
        country,
        logos,
      };
    });

    items.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "name-desc") {
      items.reverse();
    }
    return items;
  }, [filteredByCountry, groupMode, sort]);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Explorar marcas</h2>
            <p className="text-sm text-muted-foreground">
              {filtered.length} de {logos.length} marcas
            </p>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            Colección completa
          </Badge>
        </div>
        <div className="flex flex-col gap-3 sm:flex sm:flex-row sm:flex-wrap sm:items-center">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-3">
            <div className="col-span-2 flex w-full items-center gap-2 sm:w-auto">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o slug"
                className="w-full sm:w-55"
              />
              <button
                type="button"
                onClick={() =>
                  setSort((current) =>
                    current === "name-asc" ? "name-desc" : "name-asc"
                  )
                }
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background/80 text-foreground transition hover:bg-foreground/10"
                aria-label={
                  sort === "name-asc"
                    ? "Orden ascendente (A-Z)"
                    : "Orden descendente (Z-A)"
                }
                title={
                  sort === "name-asc"
                    ? "Orden ascendente (A-Z)"
                    : "Orden descendente (Z-A)"
                }
              >
                {sort === "name-asc" ? (
                  <ArrowUpAZ className="h-4 w-4" />
                ) : (
                  <ArrowDownAZ className="h-4 w-4" />
                )}
              </button>
            </div>

            <Select value={size} onValueChange={(value) => setSize(value as LogoSize)}>
              <SelectTrigger className="hidden w-full sm:inline-flex sm:w-45">
                <SelectValue placeholder="Resolución" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thumb">Mini</SelectItem>
                <SelectItem value="optimized">Optimizado</SelectItem>
                <SelectItem value="original">Original</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-3">
            <Select value={size} onValueChange={(value) => setSize(value as LogoSize)}>
              <SelectTrigger className="w-full sm:hidden">
                <SelectValue placeholder="Resolución" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thumb">Mini</SelectItem>
                <SelectItem value="optimized">Optimizado</SelectItem>
                <SelectItem value="original">Original</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={visualSize}
              onValueChange={(value) => setVisualSize(value as VisualSizeOption)}
            >
              <SelectTrigger className="w-full sm:w-45">
                <SelectValue placeholder="Tamaño visual" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Pequeño</SelectItem>
                <SelectItem value="medium">Mediano</SelectItem>
                <SelectItem value="large">Grande</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={String(density)}
              onValueChange={(value) => setDensity(Number(value) as DensityOption)}
            >
              <SelectTrigger className="hidden w-full sm:inline-flex sm:w-37.5">
                <SelectValue placeholder="Columnas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 por fila</SelectItem>
                <SelectItem value="3">3 por fila</SelectItem>
                <SelectItem value="4">4 por fila</SelectItem>
                <SelectItem value="5">5 por fila</SelectItem>
                <SelectItem value="6">6 por fila</SelectItem>
              </SelectContent>
            </Select>
            <Select value={groupMode} onValueChange={(value) => setGroupMode(value as GroupMode)}>
              <SelectTrigger className="w-full sm:w-47.5">
                <SelectValue placeholder="Agrupar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="letters">Agrupar por letras</SelectItem>
                <SelectItem value="countries">Agrupar por países</SelectItem>
              </SelectContent>
            </Select>

            <Select value={countryFilter} onValueChange={(value) => setCountryFilter(value)}>
              <SelectTrigger className="w-full sm:w-55">
                <span className="sr-only">
                  <SelectValue />
                </span>
                <span className="flex items-center gap-2">
                  {countryFilterFlag ? (
                    <img
                      src={`/api/flags/${countryFilterFlag}?size=32`}
                      alt=""
                      className="h-4 w-6 rounded-sm object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  <span className="line-clamp-1">{countryFilterLabel}</span>
                </span>
              </SelectTrigger>
              <SelectContent
                position="popper"
                side="bottom"
                align="start"
                sideOffset={6}
                className="max-h-72 data-[state=open]:animate-none data-[state=closed]:animate-none"
              >
                <SelectItem value="all">Todos los países</SelectItem>
                <SelectItem value="unknown">Sin país</SelectItem>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Regiones</SelectLabel>
                  {regionOptions.map((region) => (
                    <SelectItem key={region} value={`region:${region}`}>
                      {region}
                    </SelectItem>
                  ))}
                  <SelectSeparator />
                  <SelectLabel>Países</SelectLabel>
                  {countryOptions.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <img
                          src={`/api/flags/${country.code}?size=32`}
                          alt=""
                          className="h-4 w-6 rounded-sm object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                        {country.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {groupedLogos.length > 0 ? (
        <div className="flex flex-col gap-8">
          {groupedLogos.map((group) => (
            <div key={group.key} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                {group.country && group.country.code !== UNKNOWN_COUNTRY.code ? (
                  <img
                    src={`/api/flags/${group.country.code}`}
                    alt=""
                    className="h-5 w-5 rounded-sm"
                  />
                ) : null}
                <span className="text-2xl font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  {group.title}
                </span>
                <div className="h-px flex-1 bg-border/60" />
              </div>
              <div
                className="grid gap-4"
                style={{ gridTemplateColumns: `repeat(${effectiveColumns}, minmax(0, 1fr))` }}
              >
                {group.logos.map((logo, index) => {
                  const scale =
                    visualSize === "small" ? 1 : visualSize === "large" ? 3 : 2;
                  const classes = getSizeClasses(scale);
                  const brandKey = brandModelLinks?.[logo.slug];
                  return (
                    <Card
                      key={`${logo.slug}-${logo.isLocal ? "local" : "dataset"}-${index}`}
                      className="border-border/60 bg-white transition-shadow hover:shadow-lg dark:bg-black/30"
                    >
                      <CardContent className="flex flex-col items-center gap-3 p-5">
                        <button
                          type="button"
                          onClick={() => setSelected(logo)}
                          className={`flex w-full items-center justify-center rounded-lg border border-border/60 bg-white shadow-sm transition hover:shadow-md ${classes.container}`}
                        >
                          <img
                            src={getImageSrc(logo, size)}
                            alt={`Logo de ${logo.name}`}
                            className={`${classes.image} w-auto object-contain`}
                            loading="lazy"
                          />
                        </button>
                        <div className="flex w-full items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground">
                            {logo.name}
                          </p>
                        </div>
                        {brandKey ? (
                          <Button
                            asChild
                            variant="outline"
                            className="w-full border-border/60 text-foreground hover:bg-foreground/10 hover:text-foreground"
                          >
                            <Link href={`/brands/${brandKey}`}>Ver Modelos</Link>
                          </Button>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${effectiveColumns}, minmax(0, 1fr))` }}
        >
          {filtered.map((logo, index) => {
            const scale = visualSize === "small" ? 1 : visualSize === "large" ? 3 : 2;
            const classes = getSizeClasses(scale);
            const brandKey = brandModelLinks?.[logo.slug];
            return (
              <Card
                key={`${logo.slug}-${logo.isLocal ? "local" : "dataset"}-${index}`}
                className="border-border/60 bg-white transition-shadow hover:shadow-lg dark:bg-black/30"
              >
                <CardContent className="flex flex-col items-center gap-3 p-5">
                  <button
                    type="button"
                    onClick={() => setSelected(logo)}
                    className={`flex w-full items-center justify-center rounded-lg border border-border/60 bg-white shadow-sm transition hover:shadow-md ${classes.container}`}
                  >
                    <img
                      src={getImageSrc(logo, size)}
                      alt={`Logo de ${logo.name}`}
                      className={`${classes.image} w-auto object-contain`}
                      loading="lazy"
                    />
                  </button>
                  <div className="flex w-full items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {logo.name}
                    </p>
                  </div>
                  {brandKey ? (
                    <Button
                      asChild
                      variant="outline"
                      className="w-full border-border/60 text-foreground hover:bg-foreground/10 hover:text-foreground"
                    >
                      <Link href={`/brands/${brandKey}`}>Ver Modelos</Link>
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selected ? `Logo de ${selected.name}` : ""}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="flex flex-col items-center gap-4">
              <div className="flex w-full items-center justify-center rounded-2xl bg-white p-6">
                <img
                  src={getImageSrc(selected, "original")}
                  alt={`Logo de ${selected.name}`}
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Vista ampliada en tamaño original.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LOCALE_COOKIE_NAME, type Locale, translate } from "@/lib/i18n";

type Props = {
  locale: Locale;
};

function getNextLocale(locale: Locale) {
  return locale === "es" ? "en" : "es";
}

export function LanguageToggle({ locale }: Props) {
  const [currentLocale, setCurrentLocale] = React.useState<Locale>(locale);

  React.useEffect(() => {
    setCurrentLocale(locale);
  }, [locale]);

  const nextLocale = getNextLocale(currentLocale);
  const label = translate(currentLocale, nextLocale === "en"
    ? "language.switchToEnglish"
    : "language.switchToSpanish");

  const handleToggle = () => {
    const next = getNextLocale(currentLocale);
    document.cookie = `${LOCALE_COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`;
    setCurrentLocale(next);
    window.location.reload();
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleToggle}
      className="gap-2 border-border/60 bg-background/80 text-foreground hover:bg-foreground/10"
      aria-label={label}
      title={label}
    >
      <Globe className="h-4 w-4" />
      {nextLocale.toUpperCase()}
    </Button>
  );
}

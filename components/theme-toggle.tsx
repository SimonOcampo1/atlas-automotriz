"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";

  return (
    <div className="flex items-center gap-2">
      <Sun className="h-4 w-4 text-foreground/70" aria-hidden="true" />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Cambiar tema"
      />
      <Moon className="h-4 w-4 text-foreground/70" aria-hidden="true" />
    </div>
  );
}

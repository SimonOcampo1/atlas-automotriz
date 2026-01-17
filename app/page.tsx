import { LogoExplorer } from "@/components/logo-explorer";
import { Separator } from "@/components/ui/separator";
import { HeroSection } from "@/components/hero-section";
import { getAllLogos } from "@/lib/logos";
import { getBrandKeyForName, getBrandsWithModels } from "@/lib/ultimatespecs";

export default function Home() {
  const logos = getAllLogos();
  const brandsWithModels = getBrandsWithModels();
  const brandKeys = new Set(brandsWithModels.map((brand) => brand.key));
  const brandModelLinks = Object.fromEntries(
    logos
      .map((logo) => {
        const key = getBrandKeyForName(logo.name);
        if (!key || !brandKeys.has(key)) {
          return null;
        }
        return [logo.slug, key] as const;
      })
      .filter(Boolean) as Array<readonly [string, string]>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection logosCount={logos.length} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">

        <section
          id="explorar"
          className="grid gap-6 rounded-2xl border border-border/60 bg-white p-6 shadow-sm dark:bg-black/30"
        >
          <LogoExplorer logos={logos} brandModelLinks={brandModelLinks} />
        </section>

        <Separator />
      </main>

      <footer className="border-t border-border/60 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 text-sm text-muted-foreground">
          <p>
            Fuente de imágenes: repositorio
            {" "}
            <a
              href="https://github.com/filippofilip95/car-logos-dataset"
              className="text-foreground/80 underline underline-offset-4 hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              filippofilip95/car-logos-dataset
            </a>
            .
          </p>
          <p>
            Imágenes de autos tomadas de
            {" "}
            <a
              href="https://www.ultimatespecs.com/"
              className="text-foreground/80 underline underline-offset-4 hover:text-foreground"
              target="_blank"
              rel="noreferrer"
            >
              UltimateSpecs
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}

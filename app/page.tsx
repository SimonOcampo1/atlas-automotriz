import { LogoExplorer } from "@/components/logo-explorer";
import { Separator } from "@/components/ui/separator";
import { HeroSection } from "@/components/hero-section";
import { getServerLocale } from "@/lib/i18n-server";
import { translate } from "@/lib/i18n";
import { getAllLogos } from "@/lib/logos";
import { getBrandKeyForName, getBrandsWithModels } from "@/lib/ultimatespecs";

export default async function Home() {
  const locale = await getServerLocale();
  const logos = await getAllLogos();
  
  // CORRECCIÓN DE EMERGENCIA: Try/Catch para evitar que el build explote
  let brandsWithModels: any[] = [];
  try {
    brandsWithModels = await getBrandsWithModels();
  } catch (error) {
    console.error("Error cargando marcas (ignorando para build):", error);
    brandsWithModels = [];
  }

  const brandKeys = new Set(brandsWithModels.map((brand) => brand.key));
  const logoKeyPairs = await Promise.all(
    logos.map(async (logo) => [logo, await getBrandKeyForName(logo.name)] as const)
  );
  const brandModelLinks = Object.fromEntries(
    logoKeyPairs
      .map(([logo, key]) => {
        if (!key || !brandKeys.has(key)) {
          return null;
        }
        return [logo.slug, key] as const;
      })
      .filter(Boolean) as Array<readonly [string, string]>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection logosCount={logos.length} locale={locale} />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10">

        <section
          id="explorar"
          className="grid gap-6 rounded-2xl border border-border/60 bg-white p-6 shadow-sm dark:bg-black/30"
        >
          <LogoExplorer logos={logos} brandModelLinks={brandModelLinks} locale={locale} />
        </section>

        <Separator />
      </main>

      <footer className="border-t border-border/60 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 text-sm text-muted-foreground">
          <p>
            {translate(locale, "footer.imageSource")}
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
            {translate(locale, "footer.carImagesSource")}
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

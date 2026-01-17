import type { Logo } from "@/lib/logos";

export type LogoTierId =
  | "nivel-1"
  | "nivel-2"
  | "nivel-3"
  | "nivel-4"
  | "nivel-5"
  | "nivel-6"
  | "nivel-7"
  | "nivel-8";

export type LogoTier = {
  id: LogoTierId;
  level: number;
  label: string;
  description: string;
  hint: string;
  difficulty: string;
  tone: string;
};

export const LOGO_TIERS: LogoTier[] = [
  {
    id: "nivel-1",
    level: 1,
    label: "Fundamentos globales",
    description: "Las marcas más famosas y masivas del mundo.",
    hint: "Aprendizaje ultra rápido.",
    difficulty: "Muy fácil",
    tone:
      "border-emerald-500/30 bg-emerald-500/10 text-emerald-500 transition-colors hover:bg-emerald-500/20 hover:border-emerald-500/50",
  },
  {
    id: "nivel-2",
    level: 2,
    label: "Marcas globales",
    description: "Fabricantes con alta presencia internacional.",
    hint: "Consolida reconocimiento general.",
    difficulty: "Fácil",
    tone:
      "border-lime-500/30 bg-lime-500/10 text-lime-600 transition-colors hover:bg-lime-500/20 hover:border-lime-500/50",
  },
  {
    id: "nivel-3",
    level: 3,
    label: "Populares regionales",
    description: "Muy vistas en mercados específicos.",
    hint: "Amplía el mapa cultural.",
    difficulty: "Media-baja",
    tone:
      "border-sky-500/30 bg-sky-500/10 text-sky-500 transition-colors hover:bg-sky-500/20 hover:border-sky-500/50",
  },
  {
    id: "nivel-4",
    level: 4,
    label: "Premium y lujo",
    description: "Lujo, deportivos y marcas aspiracionales.",
    hint: "Refina detalles visuales.",
    difficulty: "Media",
    tone:
      "border-indigo-500/30 bg-indigo-500/10 text-indigo-500 transition-colors hover:bg-indigo-500/20 hover:border-indigo-500/50",
  },
  {
    id: "nivel-5",
    level: 5,
    label: "Performance y nicho",
    description: "Series limitadas y marcas de performance.",
    hint: "Ideal para entusiastas.",
    difficulty: "Media-alta",
    tone:
      "border-violet-500/30 bg-violet-500/10 text-violet-500 transition-colors hover:bg-violet-500/20 hover:border-violet-500/50",
  },
  {
    id: "nivel-6",
    level: 6,
    label: "Comerciales e industriales",
    description: "Camiones, buses y transporte pesado.",
    hint: "Diferencia flotas y transporte.",
    difficulty: "Difícil",
    tone:
      "border-amber-500/30 bg-amber-500/10 text-amber-500 transition-colors hover:bg-amber-500/20 hover:border-amber-500/50",
  },
  {
    id: "nivel-7",
    level: 7,
    label: "Históricas y locales",
    description: "Marcas antiguas o de nicho regional.",
    hint: "Requiere investigación adicional.",
    difficulty: "Muy difícil",
    tone:
      "border-orange-500/30 bg-orange-500/10 text-orange-500 transition-colors hover:bg-orange-500/20 hover:border-orange-500/50",
  },
  {
    id: "nivel-8",
    level: 8,
    label: "Raras y extintas",
    description: "Marcas poco documentadas o ya extintas.",
    hint: "Nivel experto.",
    difficulty: "Experta",
    tone:
      "border-rose-500/30 bg-rose-500/10 text-rose-500 transition-colors hover:bg-rose-500/20 hover:border-rose-500/50",
  },
];

const LEGENDARY = new Set([
  "toyota",
  "volkswagen",
  "ford",
  "chevrolet",
  "honda",
  "nissan",
  "bmw",
  "mercedes-benz",
  "audi",
  "hyundai",
  "kia",
  "renault",
  "peugeot",
  "fiat",
  "jeep",
  "tesla",
  "volvo",
  "subaru",
  "mazda",
  "lexus",
  "porsche",
  "mini",
  "land-rover",
  "jaguar",
  "seat",
  "skoda",
  "citroen",
]);

const GLOBAL = new Set([
  "opel",
  "dacia",
  "suzuki",
  "mitsubishi",
  "ram",
  "cadillac",
  "buick",
  "gmc",
  "chrysler",
  "dodge",
  "lincoln",
  "acura",
  "infiniti",
  "genesis",
  "alfa-romeo",
  "saab",
  "mg",
  "cupra",
  "saic-motor",
  "chery",
  "geely",
  "byd",
  "great-wall",
  "dongfeng",
  "faw",
  "changan",
  "haval",
  "baic-motor",
  "jac",
  "jmc",
  "tata",
  "mahindra",
  "proton",
  "perodua",
  "vinfast",
  "wuling",
  "jetour",
  "omoda",
  "bestune",
  "gac-group",
]);

const PREMIUM = new Set([
  "ferrari",
  "lamborghini",
  "bugatti",
  "bentley",
  "rolls-royce",
  "mclaren",
  "aston-martin",
  "maserati",
  "pagani",
  "koenigsegg",
  "rimac",
  "lotus",
  "polestar",
  "lucid",
  "rivian",
  "hennessey",
  "ruf",
  "brabus",
  "mansory",
  "maybach",
  "alpina",
  "bugatti",
]);

const REGIONAL = new Set([
  "gaz",
  "uaz",
  "lada",
  "zastava",
  "zaz",
  "skoda",
  "seat",
  "ds",
  "daihatsu",
  "isuzu",
  "ikco",
  "iran-khodro",
  "chery",
  "geely",
  "proton",
  "perodua",
  "mahindra",
  "tata",
  "vinfast",
  "wuling",
  "soueast",
  "saipa",
  "roewe",
  "baojun",
  "foton",
  "maxus",
  "changan",
  "haval",
]);

const COMMERCIAL = new Set([
  "scania",
  "man",
  "daf",
  "iveco",
  "mack",
  "kenworth",
  "peterbilt",
  "freightliner",
  "hino",
  "ic-bus",
  "setra",
  "irizar",
  "golden-dragon",
  "yutong",
  "sinotruk",
  "ud",
  "kamaz",
  "navistar",
  "volvo",
  "isuzu",
  "faw-jiefang",
]);

const COMMERCIAL_HINT = /(bus|truck|trucks|coach|transport|motors|motor)/i;

function isShortRecognizable(name: string) {
  const cleaned = name.replace(/[^a-zA-Z]/g, "");
  const wordCount = name.trim().split(/[\s-]+/).filter(Boolean).length;
  return cleaned.length <= 9 && wordCount <= 2;
}

function getPopularityScore(logo: Logo) {
  const slug = logo.slug.toLowerCase();
  let score = 0;

  if (LEGENDARY.has(slug)) score += 120;
  if (GLOBAL.has(slug)) score += 90;
  if (PREMIUM.has(slug)) score += 70;
  if (REGIONAL.has(slug)) score += 50;
  if (COMMERCIAL.has(slug)) score += 55;

  if (COMMERCIAL_HINT.test(slug)) score += 20;
  if (isShortRecognizable(logo.name)) score += 15;
  if (logo.isLocal) score -= 5;

  const lengthPenalty = Math.min(logo.name.length * 0.8, 20);
  score -= lengthPenalty;

  return score;
}

export function getLogoTierId(logo: Logo, total = LOGO_TIERS.length): LogoTierId {
  const score = getPopularityScore(logo);
  const maxScore = 120;
  const minScore = -20;
  const normalized = Math.max(0, Math.min(1, (score - minScore) / (maxScore - minScore)));
  const index = total - 1 - Math.round(normalized * (total - 1));
  const tier = LOGO_TIERS[index] ?? LOGO_TIERS[LOGO_TIERS.length - 1];
  return tier.id;
}

export function getTierMeta(id: LogoTierId) {
  return LOGO_TIERS.find((tier) => tier.id === id) ?? LOGO_TIERS[0];
}

export function groupLogosByTier(logos: Logo[]) {
  const tiers = LOGO_TIERS;
  const sorted = [...logos].sort(
    (a, b) => getPopularityScore(b) - getPopularityScore(a)
  );

  const grouped = tiers.reduce<Record<LogoTierId, Logo[]>>((acc, tier) => {
    acc[tier.id] = [];
    return acc;
  }, {} as Record<LogoTierId, Logo[]>);

  const total = sorted.length || 1;
  sorted.forEach((logo, index) => {
    const bucket = Math.floor((index / total) * tiers.length);
    const tier = tiers[Math.min(bucket, tiers.length - 1)];
    grouped[tier.id].push(logo);
  });

  return grouped;
}

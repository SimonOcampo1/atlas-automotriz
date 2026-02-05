import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  type Locale,
  isSupportedLocale,
} from "@/lib/i18n";

export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const value = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
    if (isSupportedLocale(value)) {
      return value;
    }
    return DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

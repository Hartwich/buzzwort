import type { SupportedLanguage } from "@open-party-lab/game-core";

export type BuzzwortLanguage = SupportedLanguage | "zh-CN";

export type ResolvedBuzzwortLanguage = "zh-CN" | "en" | "de";

export function resolveBuzzwortLanguage(language: string | null | undefined): ResolvedBuzzwortLanguage {
  if (language === "zh-CN") {
    return "zh-CN";
  }

  return language === "en" ? "en" : "de";
}

export function localizeBuzzwort<T>(
  language: string | null | undefined,
  zhCn: T,
  en: T,
  de: T
): T {
  switch (resolveBuzzwortLanguage(language)) {
    case "zh-CN":
      return zhCn;
    case "en":
      return en;
    default:
      return de;
  }
}

import type { SupportedLanguage } from "@open-party-lab/game-core";

export function buzzText(language: SupportedLanguage | undefined, de: string, en: string, es: string, fr: string, ptBR: string): string {
  return ({ de, en, es, fr, "pt-BR": ptBR })[language ?? "de"];
}

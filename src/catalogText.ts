import type { LocalizedGameTextMap } from "@open-party-lab/game-core";

export const buzzwortText = {
  "de": {
    "displayName": "Buzzwort",
    "description": "Erklaere Begriffe gegen die Uhr, ohne die verbotenen Woerter zu sagen - ein Waechter passt auf.",
    "visual": {
      "eyebrow": "Wörter"
    }
  },
  "en": {
    "displayName": "Buzzword",
    "description": "Explain terms against the clock without saying the forbidden words - a watcher is listening.",
    "visual": {
      "eyebrow": "Words"
    }
  },
  es: { displayName: "Palabra prohibida", description: "Explica conceptos contra reloj sin decir las palabras prohibidas; alguien vigila.", visual: { eyebrow: "Palabras" } },
  fr: { displayName: "Mot interdit", description: "Faites deviner des mots contre la montre sans prononcer les mots interdits. Une personne surveille.", visual: { eyebrow: "Mots" } },
  "pt-BR": { displayName: "Palavra proibida", description: "Explique conceitos contra o relógio sem dizer as palavras proibidas; alguém fica de olho.", visual: { eyebrow: "Palavras" } }
} as const satisfies LocalizedGameTextMap;

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
  }
} as const satisfies LocalizedGameTextMap;

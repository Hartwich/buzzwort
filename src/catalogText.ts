import type { LocalizedGameTextMap } from "@open-party-lab/game-core";

function setup(mode: string, duel: string, team: string, watcher: string, on: string, off: string, duration: string) {
  return {
    fields: {
      mode: { label: mode, options: { duel: { label: duel }, team: { label: team } } },
      watcher: { label: watcher, options: { on: { label: on }, off: { label: off } } },
      duration: { label: duration }
    }
  };
}

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
    lobbySetup: setup("Game mode", "Free-for-all", "Teams", "Watcher", "On", "Off", "Time per turn"),
    "visual": {
      "eyebrow": "Words"
    }
  },
  es: { displayName: "Palabra prohibida", description: "Explica conceptos contra reloj sin decir las palabras prohibidas; alguien vigila.", visual: { eyebrow: "Palabras" },
    lobbySetup: setup("Modo de juego", "Todos contra todos", "Equipos", "Vigilante", "Sí", "No", "Tiempo por turno") },
  fr: { displayName: "Mot interdit", description: "Faites deviner des mots contre la montre sans prononcer les mots interdits. Une personne surveille.", visual: { eyebrow: "Mots" },
    lobbySetup: setup("Mode de jeu", "Chacun pour soi", "Équipes", "Surveillance", "Activée", "Désactivée", "Temps par tour") },
  "pt-BR": { displayName: "Palavra proibida", description: "Explique conceitos contra o relógio sem dizer as palavras proibidas; alguém fica de olho.", visual: { eyebrow: "Palavras" },
    lobbySetup: setup("Modo de jogo", "Cada um por si", "Equipes", "Fiscal", "Sim", "Não", "Tempo por turno") }
} as const satisfies LocalizedGameTextMap;

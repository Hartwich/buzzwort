import { buzzwortText } from "./catalogText.js";
import type { GameManifest } from "@open-party-lab/game-core";

export const buzzwortManifest = {
  id: "buzzwort",
  translations: buzzwortText,
  displayName: "Buzzwort",
  description: "Erklaere Begriffe gegen die Uhr, ohne die verbotenen Woerter zu sagen - ein Waechter passt auf.",
  minPlayers: 3,
  maxPlayers: 20,
  hostView: "BuzzwortHostScene",
  controllerView: "buzzwort",
  controllerLayout: "secret_card",
  supportsTeams: true,
  estimatedRoundDurationMs: 420_000,
  roundCompletionMode: "wait_for_ready",
  hostChrome: { hud: false },
  controllerChrome: { bare: true, hideScore: true },
  lobbySetup: {
    fields: [
      {
        kind: "select", id: "mode", settingKey: "buzzwort_mode", label: "Spielmodus", defaultValue: "duel",
        options: [{ id: "duel", label: "Jeder gegen jeden" }, { id: "team", label: "Teams" }]
      },
      {
        kind: "select", id: "watcher", settingKey: "buzzwort_watcher", label: "Wächter", defaultValue: "on",
        options: [{ id: "on", label: "An" }, { id: "off", label: "Aus" }],
        visibleWhen: { field: "buzzwort_mode", anyOf: ["duel"] }
      },
      {
        kind: "select", id: "duration", settingKey: "buzzwort_turn_ms", label: "Zeit pro Zug", defaultValue: "60000",
        options: [45, 60, 90].map((seconds) => ({ id: String(seconds * 1000), label: `${seconds} s` }))
      }
    ]
  },

  ownsScreens: ["round_intro", "result"],
  visual: { accent: "#5b7f9c", icon: "chat", eyebrow: "Words" },
  audio: { track: { profile: "arcade", bpm: 124, rootMidi: 57, masterGain: 0.13 } },
} as const satisfies GameManifest;

export const manifest = buzzwortManifest;

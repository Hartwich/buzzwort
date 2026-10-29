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

  ownsScreens: ["round_intro", "result"],
  visual: { accent: "#5b7f9c", icon: "chat", eyebrow: "Words" },
  audio: { track: { profile: "arcade", bpm: 124, rootMidi: 57, masterGain: 0.13 } },
} as const satisfies GameManifest;

export const manifest = buzzwortManifest;

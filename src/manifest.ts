import type { GameManifest } from "@open-party-lab/game-core";

export const buzzwortManifest = {
  id: "buzzwort",
  displayName: "Buzzwort",
  description: "Erklaere Begriffe gegen die Uhr, ohne die verbotenen Woerter zu sagen - ein Waechter passt auf.",
  minPlayers: 3,
  maxPlayers: 20,
  hostView: "BuzzwortHostScene",
  controllerView: "buzzwort",
  controllerLayout: "secret_card",
  supportsTeams: true,
  estimatedRoundDurationMs: 420_000,
  roundCompletionMode: "wait_for_ready"
} as const satisfies GameManifest;

export const manifest = buzzwortManifest;

import type { GameManifest } from "@open-party-lab/game-core";

export const tabuManifest = {
  id: "tabu",
  displayName: "Tabu",
  description: "Erklaert Begriffe, ohne die Tabu-Woerter zu benutzen.",
  minPlayers: 2,
  maxPlayers: 20,
  hostView: "TabuHostScene",
  controllerView: "tabu",
  controllerLayout: "choice",
  supportsTeams: true,
  estimatedRoundDurationMs: 75_000,
  roundCompletionMode: "wait_for_ready"
} as const satisfies GameManifest;

export const manifest = tabuManifest;

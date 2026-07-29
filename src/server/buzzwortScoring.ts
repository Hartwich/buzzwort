// Modified for LAN Party Hub; see CHANGES.md and NOTICE.md.
import type { ScoreEntry } from "@open-party-lab/game-core";
import { localizeBuzzwort } from "../language.js";
import type { BuzzwortMode, BuzzwortTeamId } from "../protocol.js";

interface BuildBuzzwortScoreEntriesParams {
  mode: BuzzwortMode;
  scoreByPlayerId: Record<string, number>;
  scoreByTeamId: Record<BuzzwortTeamId, number>;
  teamMembersByTeamId: Record<BuzzwortTeamId, string[]>;
  language?: string;
}

export function buildBuzzwortScoreEntries(params: BuildBuzzwortScoreEntriesParams): ScoreEntry[] {
  if (params.mode === "team") {
    return (["team1", "team2"] as const).flatMap((teamId) => {
      const score = params.scoreByTeamId[teamId] ?? 0;

      if (score <= 0) {
        return [];
      }

      return (params.teamMembersByTeamId[teamId] ?? []).map((playerId) => ({
        playerId,
        delta: score,
        reason: localizeBuzzwort(
          params.language,
          `禁词挑战${teamId === "team1" ? "一队" : "二队"}得分`,
          `Buzzwort Team ${teamId === "team1" ? 1 : 2}`,
          `Buzzwort Team ${teamId === "team1" ? 1 : 2}`
        )
      }));
    });
  }

  return Object.entries(params.scoreByPlayerId)
    .filter(([, score]) => score > 0)
    .map(([playerId, score]) => ({
      playerId,
      delta: score,
      reason: localizeBuzzwort(params.language, "禁词挑战得分", "Buzzwort Punkte", "Buzzwort Punkte")
    }));
}

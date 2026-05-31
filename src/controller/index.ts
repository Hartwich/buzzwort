import type { ControllerLayoutKey } from "@open-party-lab/game-core";
import { tabuManifest } from "../manifest.js";
import type { TabuControllerState } from "../protocol.js";
import { createTabuCorrectInput } from "./tabuBindings.js";

interface ReadyLayoutModel {
  currentPlayerReady: boolean;
  readyCount: number;
  playerCount: number;
  label: string;
  description?: string;
  language?: "de" | "en";
  onToggleReady: () => void;
}

interface ChoiceLayoutModel {
  kind: "choice";
  title: string;
  subtitle?: string;
  helperText?: string;
  disabled: boolean;
  ready?: ReadyLayoutModel;
  choices: Array<{
    id: string;
    label: string;
    description?: string;
    disabled?: boolean;
    onSelect: () => void;
  }>;
  stats?: Array<{ label: string; value: string; highlighted?: boolean }>;
}

interface ControllerGameRenderContext {
  state: {
    preferredLanguage?: "de" | "en";
    room?: {
      language?: "de" | "en";
      selectedGameId?: string;
      availableGames?: Array<{ id: string; displayName?: string; roundCompletionMode?: string }>;
      players?: Array<{ id: string; name: string; isReady?: boolean }>;
    } | null;
    player?: {
      id: string;
      isReady?: boolean;
    } | null;
    game?: {
      phase?: string;
      message?: string;
      state?: unknown;
    } | null;
  };
  onInput(input: unknown): void;
  onSetReady?: (isReady: boolean) => void;
}

function buildReadyModel(context: ControllerGameRenderContext): ReadyLayoutModel | undefined {
  const { state, onSetReady } = context;
  const gameId = state.room?.selectedGameId;
  const selectedGame = gameId ? state.room?.availableGames?.find((entry) => entry.id === gameId) : undefined;

  if (
    selectedGame?.roundCompletionMode !== "wait_for_ready" ||
    state.game?.phase !== "finished" ||
    !state.room ||
    !state.player ||
    !onSetReady
  ) {
    return undefined;
  }

  const players = state.room.players ?? [];
  const playerId = state.player.id;
  const currentPlayerReady = Boolean(
    players.find((player) => player.id === playerId)?.isReady ?? state.player.isReady
  );
  const readyCount = players.filter((player) => player.isReady).length;
  const playerCount = players.length;
  const en = state.room.language === "en";

  return {
    currentPlayerReady,
    readyCount,
    playerCount,
    label: en ? "Next Round" : "Naechste Runde",
    description: en
      ? `${readyCount}/${playerCount} players are ready.`
      : `${readyCount}/${playerCount} Spieler sind bereit.`,
    language: state.room.language,
    onToggleReady: () => onSetReady(!currentPlayerReady)
  };
}

function buildTabuControllerModel(context: ControllerGameRenderContext): ChoiceLayoutModel {
  const { state, onInput } = context;
  const en = state.room?.language === "en";
  const playerId = state.player?.id ?? "";
  const tabuState = (state.game?.state ?? {}) as TabuControllerState;
  const playerNames = new Map((state.room?.players ?? []).map((player) => [player.id, player.name]));
  const currentTurnPlayerId = tabuState.currentTurnPlayerId;
  const currentTurnPlayerName = currentTurnPlayerId
    ? playerNames.get(currentTurnPlayerId) ?? currentTurnPlayerId
    : undefined;
  const currentTurnTeamId =
    tabuState.currentTurnTeamId ?? (currentTurnPlayerId ? tabuState.teamByPlayerId[currentTurnPlayerId] : undefined);
  const currentTurnTeamLabel =
    currentTurnTeamId === "team1" ? "Team 1" : currentTurnTeamId === "team2" ? "Team 2" : undefined;
  const solved = tabuState.solvedTerms ?? 0;
  const target = tabuState.targetTerms ?? 10;
  const isExplainer = tabuState.currentTurnPlayerId === playerId;
  const currentTerm = isExplainer ? tabuState.currentCardTerm ?? (en ? "Waiting for the first term" : "Warte auf den Startbegriff") : undefined;
  const remainingSeconds =
    tabuState.turnRemainingMs !== null ? Math.max(0, Math.ceil(tabuState.turnRemainingMs / 1000)) : null;
  const choices: ChoiceLayoutModel["choices"] = [];

  if (isExplainer && tabuState.mode === "duel") {
    for (const otherPlayer of state.room?.players ?? []) {
      if (otherPlayer.id === playerId) {
        continue;
      }

      choices.push({
        id: `tabu:duel:${otherPlayer.id}`,
        label: otherPlayer.name,
        description: en ? "Guessed the word" : "Hat das Wort erraten",
        disabled: state.game?.phase !== "playing",
        onSelect: () => onInput(createTabuCorrectInput(playerId, otherPlayer.id))
      });
    }
  }

  if (isExplainer && tabuState.mode === "team") {
    choices.push({
      id: "tabu:team:solved",
      label: en ? "Solved" : "Geloest",
      description: en ? "Your team guessed the word" : "Euer Team hat das Wort geschafft",
      disabled: state.game?.phase !== "playing",
      onSelect: () => onInput(createTabuCorrectInput(playerId))
    });
  }

  return {
    kind: "choice",
    title: tabuManifest.displayName,
    subtitle:
      tabuState.mode === "team"
        ? `${tabuState.currentModeLabel} | ${currentTurnTeamLabel ?? "Team"}: ${currentTurnPlayerName ?? (en ? "Unknown" : "Unbekannt")}`
        : `${tabuState.currentModeLabel} | ${en ? "Explainer" : "Erklaerer"}: ${currentTurnPlayerName ?? (en ? "Unknown" : "Unbekannt")}`,
    helperText: isExplainer
      ? tabuState.mode === "team"
        ? currentTerm
          ? `${currentTerm}\n${en ? "Tap Solved once your team guessed the word." : "Tippe auf Geloest, wenn euer Team das Wort geschafft hat."}`
          : en ? "Tap Solved once your team guessed the word." : "Tippe auf Geloest, wenn euer Team das Wort geschafft hat."
        : currentTerm
          ? `${en ? "Word" : "Wort"}: ${currentTerm}\n${en ? "Choose the player who guessed the word." : "Waehle den Spieler, der das Wort erraten hat."}`
          : en ? "Choose the player who guessed the word." : "Waehle den Spieler, der das Wort erraten hat."
      : currentTurnPlayerName
        ? `${en ? "Waiting for" : "Warte auf"} ${currentTurnPlayerName}.`
        : en ? "Waiting for the explaining player." : "Warte auf die erklaerende Person.",
    disabled: state.game?.phase !== "playing" || !isExplainer,
    choices,
    ready: buildReadyModel(context),
    stats: [
      { label: en ? "Progress" : "Fortschritt", value: `${solved}/${target}` },
      { label: en ? "Cards left" : "Karten uebrig", value: `${tabuState.remainingCards ?? 0}` },
      { label: en ? "Mode" : "Modus", value: tabuState.currentModeLabel },
      { label: en ? "Time" : "Zeit", value: remainingSeconds !== null ? `${remainingSeconds}s` : "-" },
      { label: en ? "Role" : "Rolle", value: isExplainer ? (en ? "Explainer" : "Erklaerer") : (en ? "Viewer" : "Zuschauer") },
      { label: "Team", value: currentTurnTeamLabel ?? "-" }
    ]
  };
}

export const controllerGame = {
  id: tabuManifest.id,
  layoutKey: "choice" as ControllerLayoutKey,
  buildLayout(context: ControllerGameRenderContext) {
    return buildTabuControllerModel(context);
  }
} as const;


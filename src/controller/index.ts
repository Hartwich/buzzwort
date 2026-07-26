import type { ControllerLayoutKey } from "@open-party-lab/game-core";
import { buzzwortManifest } from "../manifest.js";
import type { BuzzwortControllerState, BuzzwortEvent, BuzzwortTeamId } from "../protocol.js";
import {
  createBuzzwortCorrectInput,
  createBuzzwortSkipInput,
  createBuzzwortViolationInput
} from "./buzzwortBindings.js";

type Tone = "positive" | "neutral" | "danger";
type RoleTone = "primary" | "watch" | "guess" | "bench";

interface ReadyLayoutModel {
  currentPlayerReady: boolean;
  readyCount: number;
  playerCount: number;
  label: string;
  description?: string;
  language?: "de" | "en";
  onToggleReady: () => void;
}

interface SecretCardLayoutModel {
  kind: "secret_card";
  title: string;
  subtitle?: string;
  disabled: boolean;
  accentColor?: string;
  roleLabel: string;
  roleTone: RoleTone;
  statusLabel?: string;
  helperText?: string;
  countdownMs?: number | null;
  timer?: { remainingMs: number | null; durationMs: number } | null;
  card?: { term: string; forbidden: string[]; tag?: string } | null;
  hiddenCardHint?: string;
  actions?: Array<{
    id: string;
    label: string;
    sublabel?: string;
    tone: Tone;
    disabled?: boolean;
    onPress: () => void;
  }>;
  targetsTitle?: string;
  targets?: Array<{ id: string; name: string; hint?: string; disabled?: boolean; onSelect: () => void }>;
  scoreRows?: Array<{ id: string; label: string; value: string; accentColor?: string; highlighted?: boolean }>;
  feedTitle?: string;
  feed?: Array<{ id: string; text: string; tone?: Tone }>;
  stats?: Array<{ label: string; value: string; highlighted?: boolean }>;
  ready?: ReadyLayoutModel;
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

const TEAM_COLORS: Record<BuzzwortTeamId, string> = {
  team1: "#60a5fa",
  team2: "#f472b6"
};

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
  const en = state.room.language === "en";

  return {
    currentPlayerReady,
    readyCount,
    playerCount: players.length,
    label: en ? "Next round" : "Nächste Runde",
    description: en
      ? `${readyCount}/${players.length} players are ready.`
      : `${readyCount}/${players.length} Spieler sind bereit.`,
    language: state.room.language,
    onToggleReady: () => onSetReady(!currentPlayerReady)
  };
}

function formatEvent(event: BuzzwortEvent, en: boolean): { text: string; tone: Tone } | null {
  switch (event.kind) {
    case "solved":
      return { text: `✅ „${event.term}" — ${event.actorName}`, tone: "positive" };
    case "buzz":
      return { text: `🚫 ${"BUZZ"}: „${event.term}" (${event.actorName})`, tone: "danger" };
    case "skipped":
      return { text: `⏭ „${event.term}" ${en ? "skipped" : "übersprungen"}`, tone: "neutral" };
    case "turn_end":
      return {
        text: `🏁 ${event.actorName}: ${event.points ?? 0} ${en ? "terms" : "Begriffe"}`,
        tone: "neutral"
      };
    default:
      return null;
  }
}

function buildScoreRows(
  buzzwort: BuzzwortControllerState,
  playerNames: Map<string, string>,
  myPlayerId: string,
  en: boolean
): SecretCardLayoutModel["scoreRows"] {
  if (buzzwort.mode === "team") {
    return (["team1", "team2"] as const).map((teamId) => {
      const memberIds = buzzwort.teamMembersByTeamId?.[teamId] ?? [];
      const names = memberIds
        .map((memberId) => playerNames.get(memberId))
        .filter((name): name is string => Boolean(name));

      return {
        id: teamId,
        label: `${teamId === "team1" ? "Team 1" : "Team 2"}${names.length > 0 ? ` · ${names.join(", ")}` : ""}`,
        value: `${buzzwort.scoreByTeamId?.[teamId] ?? 0}`,
        accentColor: TEAM_COLORS[teamId],
        highlighted: buzzwort.myTeamId === teamId
      };
    });
  }

  const entries = Object.entries(buzzwort.scoreByPlayerId ?? {})
    .map(([playerId, score]) => ({ playerId, score }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);

  if (entries.length === 0) {
    return [
      {
        id: "empty",
        label: en ? "No points yet" : "Noch keine Punkte",
        value: "0"
      }
    ];
  }

  return entries.map((entry, index) => ({
    id: entry.playerId,
    label: `${index + 1}. ${playerNames.get(entry.playerId) ?? entry.playerId}`,
    value: `${entry.score}`,
    highlighted: entry.playerId === myPlayerId
  }));
}

function buildBuzzwortControllerModel(context: ControllerGameRenderContext): SecretCardLayoutModel {
  const { state, onInput } = context;
  const en = state.room?.language === "en";
  const playerId = state.player?.id ?? "";
  const buzzwort = (state.game?.state ?? {}) as BuzzwortControllerState;
  const players = state.room?.players ?? [];
  const playerNames = new Map(players.map((player) => [player.id, player.name]));

  const isPlaying = state.game?.phase === "playing";
  const isActive = isPlaying && buzzwort.turnPhase === "active";
  const explainerName = buzzwort.currentTurnPlayerId
    ? playerNames.get(buzzwort.currentTurnPlayerId) ?? buzzwort.currentTurnPlayerId
    : undefined;
  const watcherName = buzzwort.currentWatcherPlayerId
    ? playerNames.get(buzzwort.currentWatcherPlayerId) ?? buzzwort.currentWatcherPlayerId
    : undefined;

  const roleTone: RoleTone = buzzwort.isExplainer
    ? "primary"
    : buzzwort.isWatcher
      ? "watch"
      : buzzwort.role === "guesser"
        ? "guess"
        : "bench";

  const statusLabel =
    buzzwort.turnPhase === "preview"
      ? en
        ? "Get ready"
        : "Bereit machen"
      : buzzwort.turnPhase === "handover"
        ? en
          ? "Turn over"
          : "Zug vorbei"
        : en
          ? "Live"
          : "Läuft";

  const turnLabel =
    buzzwort.totalTurns > 0
      ? `${en ? "Turn" : "Zug"} ${Math.min(buzzwort.turnIndex + 1, buzzwort.totalTurns)}/${buzzwort.totalTurns}`
      : "";

  const subtitleParts = [buzzwort.modeLabel, turnLabel].filter(Boolean);

  if (buzzwort.mode === "team" && buzzwort.activeTeamLabel) {
    subtitleParts.push(`${buzzwort.activeTeamLabel} · ${explainerName ?? "?"}`);
  } else if (explainerName) {
    subtitleParts.push(`${en ? "Explains" : "Erklärt"}: ${explainerName}`);
  }

  const actions: NonNullable<SecretCardLayoutModel["actions"]> = [];
  const targets: NonNullable<SecretCardLayoutModel["targets"]> = [];

  if (buzzwort.isExplainer) {
    if (buzzwort.mode === "team") {
      actions.push({
        id: "buzzwort:solved",
        label: en ? "✅ Correct!" : "✅ Richtig!",
        sublabel: en ? "Your team guessed it" : "Euer Team hat es",
        tone: "positive",
        disabled: !isActive,
        onPress: () => onInput(createBuzzwortCorrectInput(playerId))
      });
    } else {
      for (const targetId of buzzwort.guessTargetPlayerIds ?? []) {
        targets.push({
          id: `buzzwort:guess:${targetId}`,
          name: playerNames.get(targetId) ?? targetId,
          disabled: !isActive,
          onSelect: () => onInput(createBuzzwortCorrectInput(playerId, targetId))
        });
      }
    }

    actions.push({
      id: "buzzwort:skip",
      label: en ? "⏭ Skip" : "⏭ Überspringen",
      sublabel: en
        ? `${buzzwort.skipsLeft ?? 0} left this turn`
        : `Noch ${buzzwort.skipsLeft ?? 0} in diesem Zug`,
      tone: "neutral",
      disabled: !isActive || (buzzwort.skipsLeft ?? 0) <= 0,
      onPress: () => onInput(createBuzzwortSkipInput(playerId))
    });
  }

  if (buzzwort.isWatcher) {
    actions.push({
      id: "buzzwort:violation",
      label: "🚫 BUZZ!",
      sublabel: en ? "Forbidden word used" : "Verbotenes Wort benutzt",
      tone: "danger",
      disabled: !isActive,
      onPress: () => onInput(createBuzzwortViolationInput(playerId))
    });
  }

  const helperText = (() => {
    if (!isPlaying) {
      return state.game?.message;
    }

    if (buzzwort.turnPhase === "preview") {
      if (buzzwort.isExplainer) {
        return en
          ? "Read the card. The timer starts in a moment."
          : "Lies die Karte. Gleich startet der Timer.";
      }

      if (buzzwort.isWatcher) {
        return en
          ? "You are the watcher. Listen carefully — buzz on any forbidden word."
          : "Du bist Wächter. Hör genau hin und drücke bei jedem verbotenen Wort.";
      }

      return en ? "Get ready to guess!" : "Gleich geht's ans Raten!";
    }

    if (buzzwort.turnPhase === "handover") {
      return buzzwort.lastTurnSummary ?? state.game?.message;
    }

    if (buzzwort.isExplainer) {
      return buzzwort.mode === "team"
        ? en
          ? "Explain without the crossed-out words. Tap Correct for every term your team gets."
          : "Erkläre ohne die durchgestrichenen Wörter. Tippe bei jedem Treffer auf Richtig."
        : en
          ? "Explain the term, then tap the player who guessed it."
          : "Erkläre den Begriff und tippe dann den Spieler an, der ihn erraten hat.";
    }

    if (buzzwort.isWatcher) {
      return en
        ? "Do not say anything — just buzz if a forbidden word slips out."
        : "Nichts verraten — nur drücken, wenn ein verbotenes Wort fällt.";
    }

    if (buzzwort.role === "bench") {
      return en
        ? `${explainerName ?? "?"} is explaining for the other team. Sit tight.`
        : `${explainerName ?? "?"} erklärt für das andere Team. Kurz durchatmen.`;
    }

    return en ? "Shout out your guesses!" : "Ruf deine Vorschläge rein!";
  })();

  const hiddenCardHint = buzzwort.card
    ? undefined
    : buzzwort.role === "bench"
      ? en
        ? "The other team is playing."
        : "Das andere Team ist dran."
      : en
        ? `Only ${explainerName ?? "the explainer"}${watcherName ? ` and ${watcherName}` : ""} can see the card.`
        : `Nur ${explainerName ?? "der Erklärer"}${watcherName ? ` und ${watcherName}` : ""} sehen die Karte.`;

  const feed = (buzzwort.events ?? [])
    .map((event) => {
      const formatted = formatEvent(event, en);
      return formatted ? { id: event.id, text: formatted.text, tone: formatted.tone } : null;
    })
    .filter((entry): entry is { id: string; text: string; tone: Tone } => entry !== null)
    .slice(0, 5);

  return {
    kind: "secret_card",
    title: buzzwortManifest.displayName,
    subtitle: subtitleParts.join(" · "),
    disabled: !isActive,
    roleLabel: buzzwort.roleLabel ?? (en ? "Player" : "Spieler"),
    roleTone,
    statusLabel: isPlaying ? statusLabel : undefined,
    helperText,
    countdownMs: buzzwort.turnPhase === "preview" ? buzzwort.turnPhaseRemainingMs ?? null : null,
    timer:
      buzzwort.turnPhase === "active"
        ? { remainingMs: buzzwort.turnRemainingMs ?? null, durationMs: buzzwort.turnDurationMs ?? 60_000 }
        : null,
    card: buzzwort.card
      ? {
          term: buzzwort.card.term,
          forbidden: buzzwort.card.forbidden,
          tag: buzzwort.isWatcher ? (en ? "Watcher view" : "Wächter-Ansicht") : undefined
        }
      : null,
    hiddenCardHint,
    actions,
    targetsTitle: targets.length > 0 ? (en ? "Who guessed it?" : "Wer hat es erraten?") : undefined,
    targets,
    scoreRows: buildScoreRows(buzzwort, playerNames, playerId, en),
    feedTitle: feed.length > 0 ? (en ? "Recent" : "Zuletzt") : undefined,
    feed,
    stats: [
      { label: en ? "This turn" : "Dieser Zug", value: `${buzzwort.turnSolved ?? 0}`, highlighted: true },
      { label: en ? "Total" : "Gesamt", value: `${buzzwort.solvedTerms ?? 0}` },
      { label: en ? "Role" : "Rolle", value: buzzwort.roleLabel ?? "-" }
    ],
    ready: buildReadyModel(context)
  };
}

export const controllerGame = {
  id: buzzwortManifest.id,
  layoutKey: "secret_card" as ControllerLayoutKey,
  buildLayout(context: ControllerGameRenderContext) {
    return buildBuzzwortControllerModel(context);
  }
} as const;

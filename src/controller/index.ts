import type { ControllerLayoutKey, SupportedLanguage } from "@open-party-lab/game-core";
import { buzzwortManifest } from "../manifest.js";
import type { BuzzwortControllerState, BuzzwortEvent, BuzzwortTeamId } from "../protocol.js";
import {
  createBuzzwortCorrectInput,
  createBuzzwortSkipInput,
  createBuzzwortViolationInput
} from "./buzzwortBindings.js";
import { buzzText } from "../uiText.js";

type Tone = "positive" | "neutral" | "danger";
type RoleTone = "primary" | "watch" | "guess" | "bench";

interface ReadyLayoutModel {
  currentPlayerReady: boolean;
  readyCount: number;
  playerCount: number;
  label: string;
  description?: string;
  language?: SupportedLanguage;
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
  card?: { term: string; forbidden: string[]; forbiddenLabel?: string } | null;
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
    preferredLanguage?: SupportedLanguage;
    room?: {
      language?: SupportedLanguage;
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

/**
 * Team identity colours as CSS custom properties, so the phone follows the
 * room's theme instead of shipping its own palette. Accent and sage are the two
 * tokens that stay clearly apart in both skins.
 */
const TEAM_COLORS: Record<BuzzwortTeamId, string> = {
  team1: "var(--accent)",
  team2: "var(--sage)"
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
  const language = state.room.language ?? "de";
  const t = (de: string, en: string, es: string, fr: string, pt: string) => buzzText(language, de, en, es, fr, pt);

  return {
    currentPlayerReady,
    readyCount,
    playerCount: players.length,
    label: t("Nächste Runde", "Next round", "Siguiente ronda", "Manche suivante", "Próxima rodada"),
    description: t(`${readyCount}/${players.length} Spieler sind bereit.`, `${readyCount}/${players.length} players are ready.`, `${readyCount}/${players.length} jugadores listos.`, `${readyCount}/${players.length} joueurs prêts.`, `${readyCount}/${players.length} jogadores prontos.`),
    language: state.room.language,
    onToggleReady: () => onSetReady(!currentPlayerReady)
  };
}

function formatEvent(event: BuzzwortEvent, language: SupportedLanguage): { text: string; tone: Tone } | null {
  const t = (de: string, en: string, es: string, fr: string, pt: string) => buzzText(language, de, en, es, fr, pt);
  switch (event.kind) {
    case "solved":
      return { text: `✅ „${event.term}" — ${event.actorName}`, tone: "positive" };
    case "buzz":
      return { text: `🚫 ${"BUZZ"}: „${event.term}" (${event.actorName})`, tone: "danger" };
    case "skipped":
      return { text: `⏭ „${event.term}" ${t("übersprungen", "skipped", "se saltó", "passé", "foi pulada")}`, tone: "neutral" };
    case "turn_end":
      return {
        text: `🏁 ${event.actorName}: ${event.points ?? 0} ${t("Begriffe", "terms", "palabras", "mots", "palavras")}`,
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
  language: SupportedLanguage
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
        label: buzzText(language, "Noch keine Punkte", "No points yet", "Todavía sin puntos", "Pas encore de points", "Ainda sem pontos"),
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
  const language = state.room?.language ?? state.preferredLanguage ?? "de";
  const t = (de: string, en: string, es: string, fr: string, pt: string) => buzzText(language, de, en, es, fr, pt);
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
      ? t("Bereit machen", "Get ready", "Prepárate", "Préparez-vous", "Prepare-se")
      : buzzwort.turnPhase === "handover"
        ? t("Zug vorbei", "Turn over", "Fin del turno", "Fin du tour", "Fim do turno")
        : t("Läuft", "Live", "En curso", "En cours", "Ao vivo");

  const turnLabel =
    buzzwort.totalTurns > 0
      ? `${t("Zug", "Turn", "Turno", "Tour", "Turno")} ${Math.min(buzzwort.turnIndex + 1, buzzwort.totalTurns)}/${buzzwort.totalTurns}`
      : "";

  const subtitleParts = [buzzwort.modeLabel, turnLabel].filter(Boolean);

  if (buzzwort.mode === "team" && buzzwort.activeTeamLabel) {
    subtitleParts.push(`${buzzwort.activeTeamLabel} · ${explainerName ?? "?"}`);
  } else if (explainerName) {
    subtitleParts.push(`${t("Erklärt", "Explains", "Explica", "Fait deviner", "Explica")}: ${explainerName}`);
  }

  const actions: NonNullable<SecretCardLayoutModel["actions"]> = [];
  const targets: NonNullable<SecretCardLayoutModel["targets"]> = [];

  if (buzzwort.isExplainer) {
    if (buzzwort.mode === "team") {
      actions.push({
        id: "buzzwort:solved",
        label: t("✅ Richtig!", "✅ Correct!", "✅ ¡Correcto!", "✅ Trouvé !", "✅ Acertou!"),
        sublabel: t("Euer Team hat es", "Your team guessed it", "Tu equipo acertó", "Votre équipe a trouvé", "Seu time acertou"),
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
      label: t("⏭ Überspringen", "⏭ Skip", "⏭ Saltar", "⏭ Passer", "⏭ Pular"),
      sublabel: t(`Noch ${buzzwort.skipsLeft ?? 0} in diesem Zug`, `${buzzwort.skipsLeft ?? 0} left this turn`, `Quedan ${buzzwort.skipsLeft ?? 0} en este turno`, `Encore ${buzzwort.skipsLeft ?? 0} pour ce tour`, `Restam ${buzzwort.skipsLeft ?? 0} neste turno`),
      tone: "neutral",
      disabled: !isActive || (buzzwort.skipsLeft ?? 0) <= 0,
      onPress: () => onInput(createBuzzwortSkipInput(playerId))
    });
  }

  if (buzzwort.isWatcher) {
    actions.push({
      id: "buzzwort:violation",
      label: "🚫 BUZZ!",
      sublabel: t("Verbotenes Wort benutzt", "Forbidden word used", "Se usó una palabra prohibida", "Mot interdit prononcé", "Palavra proibida usada"),
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
        return t("Lies die Karte. Gleich startet der Timer.", "Read the card. The timer starts in a moment.", "Lee la tarjeta. El reloj empieza enseguida.", "Lisez la carte. Le chrono démarre dans un instant.", "Leia a carta. O cronômetro começa já.");
      }

      if (buzzwort.isWatcher) {
        return t("Du bist Wächter. Hör genau hin und drücke bei jedem verbotenen Wort.", "You are the watcher. Listen carefully — buzz on any forbidden word.", "Eres el vigilante. Escucha y toca al oír una palabra prohibida.", "Vous surveillez. Écoutez bien et buzzez dès qu’un mot interdit est prononcé.", "Você é o fiscal. Escute com atenção e aperte ao ouvir uma palavra proibida.");
      }

      return t("Gleich geht's ans Raten!", "Get ready to guess!", "¡Prepárate para adivinar!", "Préparez-vous à deviner !", "Prepare-se para adivinhar!");
    }

    if (buzzwort.turnPhase === "handover") {
      return buzzwort.lastTurnSummary ?? state.game?.message;
    }

    if (buzzwort.isExplainer) {
      return buzzwort.mode === "team"
        ? t("Erkläre ohne die durchgestrichenen Wörter. Tippe bei jedem Treffer auf Richtig.", "Explain without the crossed-out words. Tap Correct for every term your team gets.", "Explica sin usar las palabras tachadas. Pulsa Correcto por cada acierto de tu equipo.", "Faites deviner sans utiliser les mots barrés. Appuyez sur Trouvé à chaque bonne réponse.", "Explique sem usar as palavras riscadas. Toque em Acertou a cada palavra do seu time.")
        : t("Erkläre den Begriff und tippe dann den Spieler an, der ihn erraten hat.", "Explain the term, then tap the player who guessed it.", "Explica el concepto y toca a quien lo adivinó.", "Faites deviner le mot, puis choisissez la personne qui l’a trouvé.", "Explique a palavra e toque em quem acertou.");
    }

    if (buzzwort.isWatcher) {
      return t("Nichts verraten — nur drücken, wenn ein verbotenes Wort fällt.", "Do not say anything — just buzz if a forbidden word slips out.", "No digas nada; toca si alguien dice una palabra prohibida.", "Ne dites rien : buzzez uniquement si un mot interdit est prononcé.", "Não diga nada — aperte apenas se alguém falar uma palavra proibida.");
    }

    if (buzzwort.role === "bench") {
      return t(`${explainerName ?? "?"} erklärt für das andere Team. Kurz durchatmen.`, `${explainerName ?? "?"} is explaining for the other team. Sit tight.`, `${explainerName ?? "?"} explica para el otro equipo. Espera un momento.`, `${explainerName ?? "?"} fait deviner à l’autre équipe. Patientez.`, `${explainerName ?? "?"} está explicando para o outro time. Aguarde um pouco.`);
    }

    return t("Ruf deine Vorschläge rein!", "Shout out your guesses!", "¡Di tus respuestas en voz alta!", "Annoncez vos réponses à voix haute !", "Fale seus palpites em voz alta!");
  })();

  const hiddenCardHint = buzzwort.card
    ? undefined
    : !isPlaying || buzzwort.turnPhase === "handover" || buzzwort.role === "bench"
      ? undefined
      : t(`Nur ${explainerName ?? "der Erklärer"}${watcherName ? ` und ${watcherName}` : ""} sehen die Karte.`, `Only ${explainerName ?? "the explainer"}${watcherName ? ` and ${watcherName}` : ""} can see the card.`, `Solo ${explainerName ?? "quien explica"}${watcherName ? ` y ${watcherName}` : ""} ven la tarjeta.`, `Seuls ${explainerName ?? "la personne qui fait deviner"}${watcherName ? ` et ${watcherName}` : ""} voient la carte.`, `Só ${explainerName ?? "quem explica"}${watcherName ? ` e ${watcherName}` : ""} podem ver a carta.`);

  const feed = (buzzwort.events ?? [])
    .map((event) => {
      const formatted = formatEvent(event, language);
      return formatted ? { id: event.id, text: formatted.text, tone: formatted.tone } : null;
    })
    .filter((entry): entry is { id: string; text: string; tone: Tone } => entry !== null)
    .slice(0, 5);

  return {
    kind: "secret_card",
    title: buzzwortManifest.translations[language]?.displayName ?? buzzwortManifest.translations.de.displayName,
    subtitle: subtitleParts.join(" · "),
    disabled: !isActive,
    roleLabel: buzzwort.roleLabel ?? t("Spieler", "Player", "Jugador", "Joueur", "Jogador"),
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
          forbiddenLabel: t("Verbotene Wörter", "Forbidden words", "Palabras prohibidas", "Mots interdits", "Palavras proibidas")
        }
      : null,
    hiddenCardHint,
    actions,
    targetsTitle: targets.length > 0 ? t("Wer hat es erraten?", "Who guessed it?", "¿Quién lo adivinó?", "Qui a trouvé ?", "Quem acertou?") : undefined,
    targets,
    scoreRows: buildScoreRows(buzzwort, playerNames, playerId, language),
    feedTitle: feed.length > 0 ? t("Zuletzt", "Recent", "Reciente", "Récent", "Recentes") : undefined,
    feed,
    stats: [
      { label: t("Dieser Zug", "This turn", "Este turno", "Ce tour", "Neste turno"), value: `${buzzwort.turnSolved ?? 0}`, highlighted: true },
      { label: t("Gesamt", "Total", "Total", "Total", "Total"), value: `${buzzwort.solvedTerms ?? 0}` }
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

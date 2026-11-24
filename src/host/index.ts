import type { HostGame, HostGameStateSource, SupportedLanguage } from "@open-party-lab/game-core";
import { buzzwortManifest } from "../manifest.js";
import type { BuzzwortControllerState, BuzzwortEvent } from "../protocol.js";
import { buzzText } from "../uiText.js";
import { hostStyles } from "./styles.js";

interface HostState {
  game?: { phase?: string; message?: string; state?: unknown } | null;
  room?: {
    language?: SupportedLanguage;
    pausedBy?: unknown;
    players?: Array<{ id: string; name: string }>;
  } | null;
  scoreboard?: { entries?: Array<{ playerId: string; delta: number; total: number }> } | null;
}

const resultPhases = new Set(["result", "scoreboard", "finished"]);
type Translate = (de: string, en: string, es: string, fr: string, pt: string) => string;

function add<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement, tag: K, className: string, value?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (value !== undefined) node.textContent = value;
  parent.append(node);
  return node;
}

function scoreRow(parent: HTMLElement, name: string, score: number, delta?: number): HTMLLIElement {
  const row = add(parent, "li", "bw-score");
  add(row, "span", "bw-name", name);
  if (delta !== undefined) add(row, "span", "bw-delta", delta > 0 ? `+${delta}` : String(delta));
  add(row, "strong", "bw-value", String(score));
  return row;
}

function addEvent(parent: HTMLElement, event: BuzzwortEvent, t: Translate): void {
  const row = add(parent, "li", "bw-event");
  row.dataset.kind = event.kind;
  const label = event.kind === "solved" ? t("Erraten", "Solved", "Adivinada", "Trouvé", "Acertou")
    : event.kind === "buzz" ? "Buzz!"
    : t("Übersprungen", "Skipped", "Saltada", "Passé", "Pulou");
  const who = event.targetName ?? event.actorName;
  add(row, "span", "bw-event-type", label);
  add(row, "strong", "bw-event-term", event.term);
  if (who) add(row, "span", "bw-event-player", who);
}

export function mountBuzzwortHost(input: unknown, source: HostGameStateSource): () => void {
  const root = input as HTMLElement;
  const style = add(root, "style", "");
  style.textContent = hostStyles;
  const screen = add(root, "main", "buzzwort-host");
  let lastRender = "";
  let timer: HTMLElement | undefined;
  let digits: HTMLElement | undefined;
  let deadline: number | null = null;
  let duration = 1;
  let pausedAt: number | null = null;
  let lastTurnState: BuzzwortControllerState | undefined;

  const updateTimer = () => {
    if (!timer || !digits || deadline === null) return;
    const remaining = Math.max(0, deadline - (pausedAt ?? performance.now()));
    const seconds = Math.ceil(remaining / 1000);
    const label = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
    if (digits.textContent !== label) digits.textContent = label;
    timer.style.setProperty("--bw-progress", `${Math.min(1, remaining / duration)}turn`);
    const urgent = String(lastTurnState?.turnPhase === "active" && remaining <= 10_000);
    if (timer.dataset.urgent !== urgent) timer.dataset.urgent = urgent;
  };

  const unsubscribe = source.subscribe((input) => {
    const app = input as HostState;
    const game = app.game;
    const state = game?.state as BuzzwortControllerState | undefined;
    const phase = game?.phase;
    const language = app.room?.language ?? "de";
    const players = app.room?.players ?? [];
    const names = new Map(players.map(({ id, name }) => [id, name]));
    const name = (id?: string) => id ? names.get(id) ?? "" : "";
    const t: Translate = (...words) => buzzText(language, ...words);
    const title = buzzwortManifest.translations[language].displayName;
    const result = resultPhases.has(phase ?? "");
    const play = phase === "playing" && Boolean(state?.currentTurnPlayerId);
    const paused = Boolean(app.room?.pausedBy);
    const now = performance.now();
    if (state !== lastTurnState) {
      lastTurnState = state;
      const active = state?.turnPhase === "active";
      const remaining = active ? state.turnRemainingMs : state?.turnPhase === "preview" ? state.turnPhaseRemainingMs : null;
      duration = active ? Math.max(1, state.turnDurationMs) : 4_000;
      deadline = play && remaining != null ? (paused ? pausedAt ?? now : now) + remaining : null;
    } else if (!paused && pausedAt !== null && deadline !== null) {
      deadline += now - pausedAt;
    }
    pausedAt = paused ? pausedAt ?? now : null;

    const key = JSON.stringify([
      phase, game?.message, language, paused, [...names], state?.turnPhase,
      state?.turnIndex, state?.totalTurns, state?.mode, state?.currentTurnPlayerId,
      state?.currentWatcherPlayerId, state?.currentTurnTeamId, state?.turnSolved, state?.solvedTerms,
      state?.activeTeamLabel, state?.scoreByTeamId, state?.teamMembersByTeamId, state?.scoreByPlayerId, state?.events,
      state?.lastTurnSummary, app.scoreboard?.entries
    ]);
    if (key === lastRender) {
      updateTimer();
      return;
    }
    lastRender = key;
    const scroll = screen.scrollTop;
    const previousFocus = screen.querySelector<HTMLElement>(":focus");
    const focusedList = previousFocus?.className;
    const standingsScroll = screen.querySelector(".bw-standings-list")?.scrollTop ?? 0;
    screen.replaceChildren();
    screen.dataset.phase = result ? "result" : play && state ? state.turnPhase : "intro";
    timer = digits = undefined;

    const top = add(screen, "header", "bw-header");
    add(top, "strong", "bw-title", title);
    if (play && state) {
      const turn = `${t("Zug", "Turn", "Turno", "Tour", "Turno")} ${Math.min(state.turnIndex + 1, state.totalTurns)} / ${state.totalTurns}`;
      add(top, "span", "bw-turn", turn);
    }

    if (!play || !state || result) {
      const panel = add(screen, "section", "bw-end");
      add(panel, "h1", "", result
        ? t("Runde vorbei", "Round over", "Fin de la ronda", "Fin de la manche", "Fim da rodada")
        : t("Gleich geht’s los", "Starting shortly", "La ronda empieza pronto", "La manche commence bientôt", "A rodada começa em breve"));
      if (game?.message) add(panel, "p", "bw-caption", game.message);
      if (result && app.scoreboard?.entries?.length) {
        const entries = add(panel, "ol", "bw-result-list");
        for (const entry of app.scoreboard.entries) {
          scoreRow(entries, name(entry.playerId), entry.total, entry.delta);
        }
      }
      if (phase === "finished") add(panel, "p", "bw-caption",
        t("Für die nächste Runde am Handy bereit melden.", "Ready up on your phone for the next round.", "Pulsa Listo en el celular para la siguiente ronda.", "Préparez-vous sur votre téléphone pour la manche suivante.", "Toque em Pronto no celular para a próxima rodada."));
      return;
    }

    const stage = add(screen, "section", "bw-stage");
    const roles = add(stage, "div", "bw-roles");
    const phaseLabel = paused ? t("Pause", "Paused", "Pausa", "Pause", "Pausa")
      : state.turnPhase === "active" ? t("Erklärt", "Explaining", "Explica", "Fait deviner", "Explica")
      : state.turnPhase === "preview" ? t("Als Nächstes", "Up next", "A continuación", "À suivre", "A seguir")
      : t("Zug vorbei", "Turn over", "Fin del turno", "Fin du tour", "Fim do turno");
    add(roles, "p", "bw-role", [phaseLabel, state.activeTeamLabel].filter(Boolean).join(" · "));
    add(roles, "h1", "", name(state.currentTurnPlayerId));
    const watcher = name(state.currentWatcherPlayerId);
    if (watcher) add(roles, "p", "bw-watcher", `${t("Wächter", "Watcher", "Vigilante", "Surveillance", "Fiscal")} · ${watcher}`);
    if (state.turnPhase === "handover" && state.lastTurnSummary) {
      add(roles, "p", "bw-caption", state.lastTurnSummary);
    }
    if (state.turnPhase !== "handover") {
      timer = add(stage, "div", "bw-clock");
      const face = add(timer, "div", "bw-face");
      digits = add(face, "strong", "bw-digits", "–");
      add(face, "span", "bw-clock-label", state.turnPhase === "preview"
        ? t("Start in", "Starts in", "Empieza en", "Départ dans", "Começa em")
        : t("Restzeit", "Time left", "Tiempo restante", "Temps restant", "Tempo restante"));
    }

    const details = add(screen, "div", "bw-details");
    const activity = add(details, "section", "bw-activity");
    const activityHeader = add(activity, "div", "bw-section-header");
    add(activityHeader, "h2", "", t("Letzte Begriffe", "Recent words", "Últimas palabras", "Derniers mots", "Últimas palavras"));
    add(activityHeader, "span", "bw-count", `${state.turnSolved} ${t("in diesem Zug", "this turn", "en este turno", "ce tour", "neste turno")} · ${state.solvedTerms} ${t("gesamt", "total", "en total", "au total", "no total")}`);
    const events = (state.events ?? []).filter(({ kind }) => kind === "solved" || kind === "buzz" || kind === "skipped").slice(0, 4);
    if (events.length) {
      const list = add(activity, "ul", "bw-events");
      for (const event of events) addEvent(list, event, t);
    } else {
      add(activity, "p", "bw-caption", watcher
        ? t("Die Karte liegt auf den Handys von Erklärer und Wächter.", "The explainer and watcher have the card on their phones.", "Quien explica y quien vigila tienen la tarjeta en su celular.", "La carte est sur les téléphones de la personne qui fait deviner et du surveillant.", "Quem explica e quem fiscaliza têm a carta no celular.")
        : t("Die Karte liegt auf dem Handy der erklärenden Person.", "The explainer has the card on their phone.", "Quien explica tiene la tarjeta en su celular.", "La carte est sur le téléphone de la personne qui fait deviner.", "Quem explica tem a carta no celular."));
    }

    const standings = add(details, "section", "bw-standings");
    const standingsHeading = add(standings, "h2", "", t("Spielstand", "Standings", "Marcador", "Classement", "Placar"));
    standingsHeading.id = "bw-standings-title";
    const list = add(standings, "ul", "bw-standings-list");
    list.tabIndex = 0;
    list.setAttribute("aria-labelledby", standingsHeading.id);
    if (state.mode === "team") {
      for (const [index, team] of (["team1", "team2"] as const).entries()) {
        const row = scoreRow(list, `${t("Team", "Team", "Equipo", "Équipe", "Equipe")} ${index + 1}`, state.scoreByTeamId[team]);
        row.dataset.active = String(team === state.currentTurnTeamId);
        row.dataset.team = team;
        const members = state.teamMembersByTeamId[team].map(name).filter(Boolean).join(" · ");
        add(row, "span", "bw-members", members);
      }
    } else {
      for (const [id, score] of Object.entries(state.scoreByPlayerId).sort((a, b) => b[1] - a[1])) {
        const row = scoreRow(list, name(id), score);
        row.dataset.active = String(id === state.currentTurnPlayerId);
      }
    }
    if (focusedList === list.className) list.focus({ preventScroll: true });
    list.scrollTop = standingsScroll;
    screen.scrollTop = scroll;
    updateTimer();
  });
  const ticker = window.setInterval(updateTimer, 100);
  return () => {
    unsubscribe();
    window.clearInterval(ticker);
    screen.remove();
    style.remove();
  };
}

export const hostGame = {
  id: buzzwortManifest.id,
  displayName: buzzwortManifest.displayName,
  mountDom: mountBuzzwortHost
} satisfies HostGame;

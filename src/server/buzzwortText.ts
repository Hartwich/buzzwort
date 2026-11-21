import type { BuzzwortMode, BuzzwortRole, BuzzwortTeamId } from "../protocol.js";

export interface BuzzwortTexts {
  modeDuel: string;
  modeTeam: string;
  roleExplainer: string;
  roleWatcher: string;
  roleGuesser: string;
  roleBench: string;
  team1: string;
  team2: string;
  unknownPlayer: string;
  preparing: string;
  getReady: (name: string) => string;
  turnStart: (name: string, team?: string) => string;
  turnStartWithWatcher: (name: string, watcher: string, team?: string) => string;
  solved: (term: string, name: string) => string;
  skipped: (term: string) => string;
  violation: (term: string, watcher: string) => string;
  turnSummary: (name: string, solved: number, violations: number) => string;
  noCards: string;
  finalTeam: (winner: string | null, a: number, b: number) => string;
  finalDuel: (name: string | null, points: number) => string;
}

const de: BuzzwortTexts = {
  modeDuel: "Jeder gegen jeden",
  modeTeam: "Teammodus",
  roleExplainer: "Erklärer",
  roleWatcher: "Wächter",
  roleGuesser: "Rater",
  roleBench: "Zuschauer",
  team1: "Team 1",
  team2: "Team 2",
  unknownPlayer: "Unbekannt",
  preparing: "Buzzwort wird vorbereitet.",
  getReady: (name) => `${name} macht sich bereit …`,
  turnStart: (name, team) => (team ? `${team}: ${name} erklärt jetzt!` : `${name} erklärt jetzt!`),
  turnStartWithWatcher: (name, watcher, team) =>
    team
      ? `${team}: ${name} erklärt, ${watcher} bewacht die Karte.`
      : `${name} erklärt, ${watcher} bewacht die Karte.`,
  solved: (term, name) => `„${term}" — ${name} hat es!`,
  skipped: (term) => `„${term}" übersprungen.`,
  violation: (term, watcher) => `BUZZ! ${watcher} erwischt — „${term}" ist weg.`,
  turnSummary: (name, solved, violations) =>
    violations > 0
      ? `${name}: ${solved} Begriffe, ${violations}× Buzzwort.`
      : `${name}: ${solved} Begriffe geschafft.`,
  noCards: "Keine Buzzwort-Karten verfügbar.",
  finalTeam: (winner, a, b) =>
    winner ? `${winner} gewinnt mit ${Math.max(a, b)}:${Math.min(a, b)}!` : `Unentschieden ${a}:${b}!`,
  finalDuel: (name, points) => (name ? `${name} führt mit ${points} Punkten.` : "Runde vorbei.")
};

const en: BuzzwortTexts = {
  modeDuel: "Free-for-all",
  modeTeam: "Team mode",
  roleExplainer: "Explainer",
  roleWatcher: "Watcher",
  roleGuesser: "Guesser",
  roleBench: "Spectator",
  team1: "Team 1",
  team2: "Team 2",
  unknownPlayer: "Unknown",
  preparing: "Preparing Buzzword.",
  getReady: (name) => `${name} is getting ready …`,
  turnStart: (name, team) => (team ? `${team}: ${name} is explaining!` : `${name} is explaining!`),
  turnStartWithWatcher: (name, watcher, team) =>
    team ? `${team}: ${name} explains, ${watcher} watches the card.` : `${name} explains, ${watcher} watches the card.`,
  solved: (term, name) => `"${term}" — ${name} got it!`,
  skipped: (term) => `"${term}" skipped.`,
  violation: (term, watcher) => `BUZZ! ${watcher} caught it — "${term}" is gone.`,
  turnSummary: (name, solved, violations) =>
    violations > 0 ? `${name}: ${solved} terms, ${violations} forbidden calls.` : `${name}: ${solved} terms solved.`,
  noCards: "No Buzzword cards available.",
  finalTeam: (winner, a, b) =>
    winner ? `${winner} wins ${Math.max(a, b)}:${Math.min(a, b)}!` : `Draw ${a}:${b}!`,
  finalDuel: (name, points) => (name ? `${name} leads with ${points} points.` : "Round over.")
};

const es: BuzzwortTexts = {
  modeDuel: "Todos contra todos", modeTeam: "Modo por equipos", roleExplainer: "Explicador", roleWatcher: "Vigilante", roleGuesser: "Adivinador", roleBench: "Espectador",
  team1: "Equipo 1", team2: "Equipo 2", unknownPlayer: "Persona desconocida", preparing: "Preparando Palabra prohibida.",
  getReady: (name) => `${name} se está preparando…`, turnStart: (name, team) => team ? `${team}: ¡${name} empieza a explicar!` : `¡${name} empieza a explicar!`,
  turnStartWithWatcher: (name, watcher, team) => team ? `${team}: ${name} explica y ${watcher} vigila la tarjeta.` : `${name} explica y ${watcher} vigila la tarjeta.`,
  solved: (term, name) => `«${term}» — ¡${name} lo adivinó!`, skipped: (term) => `Se saltó «${term}».`, violation: (term, watcher) => `¡BUZZ! ${watcher} lo detectó: «${term}» queda fuera.`,
  turnSummary: (name, solved, violations) => violations > 0 ? `${name}: ${solved} palabras, ${violations} infracciones.` : `${name}: adivinó ${solved} palabras.`,
  noCards: "No hay tarjetas disponibles.", finalTeam: (winner, a, b) => winner ? `¡${winner} gana ${Math.max(a, b)}:${Math.min(a, b)}!` : `¡Empate ${a}:${b}!`,
  finalDuel: (name, points) => name ? `${name} lidera con ${points} puntos.` : "Fin de la ronda."
};

const fr: BuzzwortTexts = {
  modeDuel: "Chacun pour soi", modeTeam: "Mode équipes", roleExplainer: "Personne qui fait deviner", roleWatcher: "Surveillant", roleGuesser: "Personne qui devine", roleBench: "Spectateur",
  team1: "Équipe 1", team2: "Équipe 2", unknownPlayer: "Personne inconnue", preparing: "Préparation de Mot interdit.",
  getReady: (name) => `${name} se prépare…`, turnStart: (name, team) => team ? `${team} : ${name} fait deviner !` : `${name} fait deviner !`,
  turnStartWithWatcher: (name, watcher, team) => team ? `${team} : ${name} fait deviner, ${watcher} surveille la carte.` : `${name} fait deviner, ${watcher} surveille la carte.`,
  solved: (term, name) => `« ${term} » — ${name} a trouvé !`, skipped: (term) => `« ${term} » passé.`, violation: (term, watcher) => `BUZZ ! ${watcher} a repéré le mot interdit « ${term} ».`,
  turnSummary: (name, solved, violations) => violations > 0 ? `${name} : ${solved} mots, ${violations} infractions.` : `${name} a fait deviner ${solved} mots.`,
  noCards: "Aucune carte Mot interdit disponible.", finalTeam: (winner, a, b) => winner ? `${winner} gagne ${Math.max(a, b)}–${Math.min(a, b)} !` : `Égalité ${a}–${b} !`,
  finalDuel: (name, points) => name ? `${name} mène avec ${points} points.` : "Fin de manche."
};

const ptBr: BuzzwortTexts = {
  modeDuel: "Cada um por si", modeTeam: "Modo em equipe", roleExplainer: "Quem explica", roleWatcher: "Fiscal", roleGuesser: "Quem adivinha", roleBench: "Espectador",
  team1: "Time 1", team2: "Time 2", unknownPlayer: "Pessoa desconhecida", preparing: "Preparando Palavra proibida.",
  getReady: (name) => `${name} está se preparando…`, turnStart: (name, team) => team ? `${team}: ${name} vai explicar!` : `${name} vai explicar!`,
  turnStartWithWatcher: (name, watcher, team) => team ? `${team}: ${name} explica e ${watcher} fiscaliza a carta.` : `${name} explica e ${watcher} fiscaliza a carta.`,
  solved: (term, name) => `“${term}” — ${name} acertou!`, skipped: (term) => `“${term}” foi pulada.`, violation: (term, watcher) => `BUZZ! ${watcher} pegou: “${term}” saiu da rodada.`,
  turnSummary: (name, solved, violations) => violations > 0 ? `${name}: ${solved} palavras, ${violations} infrações.` : `${name}: acertou ${solved} palavras.`,
  noCards: "Não há cartas de Palavra proibida disponíveis.", finalTeam: (winner, a, b) => winner ? `${winner} venceu por ${Math.max(a, b)} a ${Math.min(a, b)}!` : `Empate em ${a} a ${b}!`,
  finalDuel: (name, points) => name ? `${name} lidera com ${points} pontos.` : "Fim da rodada."
};

export function resolveBuzzwortTexts(language: string): BuzzwortTexts {
  return language === "en" ? en : language === "es" ? es : language === "fr" ? fr : language === "pt-BR" ? ptBr : de;
}

export function resolveModeLabel(texts: BuzzwortTexts, mode: BuzzwortMode): string {
  return mode === "team" ? texts.modeTeam : texts.modeDuel;
}

export function resolveTeamLabel(texts: BuzzwortTexts, teamId?: BuzzwortTeamId): string | undefined {
  if (teamId === "team1") {
    return texts.team1;
  }

  if (teamId === "team2") {
    return texts.team2;
  }

  return undefined;
}

export function resolveRoleLabel(texts: BuzzwortTexts, role: BuzzwortRole): string {
  switch (role) {
    case "explainer":
      return texts.roleExplainer;
    case "watcher":
      return texts.roleWatcher;
    case "guesser":
      return texts.roleGuesser;
    default:
      return texts.roleBench;
  }
}

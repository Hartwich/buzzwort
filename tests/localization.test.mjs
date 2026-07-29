import assert from "node:assert/strict";
import test from "node:test";

import { controllerGame } from "../dist/controller/index.js";
import { serverGame } from "../dist/server/index.js";
import {
  buzzwortCardsDe,
  buzzwortCardsEn,
  buzzwortCardsZhCn,
  resolveBuzzwortDeck
} from "../dist/server/content/buzzwortCards.js";
import { resolveBuzzwortTexts } from "../dist/server/buzzwortText.js";

const categories = [
  "alltag",
  "essen",
  "natur",
  "tiere",
  "technik",
  "sport",
  "kultur",
  "orte",
  "beruf",
  "abstrakt"
];

const players = [
  { id: "p1", name: "小林", color: "#60a5fa", score: 0, isReady: false, connected: true },
  { id: "p2", name: "阿岚", color: "#f472b6", score: 0, isReady: false, connected: true },
  { id: "p3", name: "可可", color: "#4ade80", score: 0, isReady: false, connected: true }
];

function serverContext(now = 1_000, overrides = {}) {
  return {
    roomCode: "ZH01",
    roundNumber: 1,
    players,
    now,
    deltaMs: 0,
    language: "zh-CN",
    selectedGame: serverGame.manifest,
    previousRound: null,
    roomSettings: {},
    ...overrides
  };
}

function sampleControllerState(overrides = {}) {
  return {
    mode: "duel",
    modeLabel: "自由对战",
    watcherEnabled: true,
    turnPhase: "active",
    turnPhaseRemainingMs: 30_000,
    turnDurationMs: 60_000,
    turnEndsAt: 61_000,
    turnRemainingMs: 30_000,
    turnIndex: 0,
    totalTurns: 3,
    role: "explainer",
    roleLabel: "讲解员",
    isExplainer: true,
    isWatcher: false,
    card: {
      term: "雨伞",
      forbidden: ["下雨", "撑开", "淋湿", "伞柄", "天气"],
      category: "alltag",
      difficulty: 1
    },
    turnSolved: 1,
    skipsLeft: 2,
    turnViolations: 0,
    currentTurnPlayerId: "p1",
    currentWatcherPlayerId: "p2",
    scoreByPlayerId: { p1: 1, p3: 1 },
    scoreByTeamId: { team1: 0, team2: 0 },
    teamByPlayerId: {},
    teamMembersByTeamId: { team1: [], team2: [] },
    guessTargetPlayerIds: ["p3"],
    remainingCards: 119,
    solvedTerms: 1,
    events: [
      { id: "skip-1", kind: "skipped", at: 900, term: "牙刷", actorName: "小林" },
      { id: "buzz-1", kind: "buzz", at: 800, term: "闹钟", actorName: "阿岚" },
      { id: "end-1", kind: "turn_end", at: 700, actorName: "小林", points: 1 }
    ],
    ...overrides
  };
}

function controllerContext(gameState, overrides = {}) {
  const inputs = [];
  const readyChanges = [];
  const context = {
    state: {
      preferredLanguage: "zh-CN",
      room: {
        language: "zh-CN",
        selectedGameId: "buzzwort",
        availableGames: [
          { id: "buzzwort", displayName: "禁词挑战", roundCompletionMode: "wait_for_ready" }
        ],
        players: players.map(({ id, name, isReady }) => ({ id, name, isReady }))
      },
      player: { id: "p1", isReady: false },
      game: { phase: "playing", message: "回合进行中。", state: gameState }
    },
    onInput(input) {
      inputs.push(input);
    },
    onSetReady(isReady) {
      readyChanges.push(isReady);
    }
  };

  Object.assign(context.state, overrides.state);
  return { context, inputs, readyChanges };
}

test("the Simplified Chinese deck is complete, balanced, and internally valid", () => {
  assert.equal(buzzwortCardsZhCn.length, 120);
  assert.equal(new Set(buzzwortCardsZhCn.map((card) => card.id)).size, 120);
  assert.equal(new Set(buzzwortCardsZhCn.map((card) => card.term)).size, 120);

  const categoryCounts = Object.fromEntries(categories.map((category) => [category, 0]));
  const difficultyCounts = { 1: 0, 2: 0, 3: 0 };

  buzzwortCardsZhCn.forEach((card, index) => {
    assert.equal(card.id, `zh-CN-${String(index + 1).padStart(3, "0")}`);
    assert.ok(categories.includes(card.category), `unexpected category on ${card.id}`);
    assert.match(card.term, /[\u3400-\u9fff]/u);
    assert.equal(card.term, card.term.trim());
    assert.equal(card.forbidden.length, 5, `${card.id} must have five forbidden terms`);
    assert.equal(new Set(card.forbidden).size, 5, `${card.id} must not repeat forbidden terms`);
    assert.ok(card.forbidden.every((term) => term.trim().length > 0));
    assert.ok(card.forbidden.every((term) => term !== card.term));

    categoryCounts[card.category] += 1;
    difficultyCounts[card.difficulty] += 1;
  });

  assert.deepEqual(categoryCounts, Object.fromEntries(categories.map((category) => [category, 12])));
  assert.deepEqual(difficultyCounts, { 1: 50, 2: 50, 3: 20 });
});

test("language selection returns the matching deck and server copy", () => {
  assert.strictEqual(resolveBuzzwortDeck("zh-CN"), buzzwortCardsZhCn);
  assert.strictEqual(resolveBuzzwortDeck("en"), buzzwortCardsEn);
  assert.strictEqual(resolveBuzzwortDeck("de"), buzzwortCardsDe);
  assert.equal(resolveBuzzwortTexts("zh-CN").roleExplainer, "讲解员");
  assert.equal(resolveBuzzwortTexts("en").roleExplainer, "Explainer");
  assert.equal(resolveBuzzwortTexts("de").roleExplainer, "Erklärer");
});

test("the authoritative server uses Chinese cards and keeps them private", () => {
  const context = serverContext();
  const initial = serverGame.createInitialState(context);
  const started = serverGame.startRound(initial, context);

  assert.equal(initial.message, "正在准备禁词挑战。");
  assert.match(started.currentCard?.id ?? "", /^zh-CN-/u);
  assert.match(started.message ?? "", /做好准备/u);

  const explainerId = started.currentTurnPlayerId;
  const watcherId = started.currentWatcherPlayerId;
  const guesserId = players.find((player) => player.id !== explainerId && player.id !== watcherId)?.id;

  assert.ok(explainerId);
  assert.ok(watcherId);
  assert.ok(guesserId);
  assert.ok(serverGame.toControllerStateForPlayer(started, context, explainerId).card);
  assert.ok(serverGame.toControllerStateForPlayer(started, context, watcherId).card);
  assert.equal(serverGame.toControllerStateForPlayer(started, context, guesserId).card, undefined);
  assert.equal(serverGame.toPublicState(started, context).card, undefined);

  const activeContext = serverContext(started.turnPhaseEndsAt);
  const active = serverGame.tick(started, 4_000, activeContext);
  assert.equal(active.turnPhase, "active");
  assert.match(active.message ?? "", /讲解/u);

  const solved = serverGame.handleInput(
    active,
    {
      type: "buzzwort_correct",
      playerId: explainerId,
      guessedPlayerId: guesserId,
      sentAt: activeContext.now,
      pressedAt: activeContext.now
    },
    activeContext
  );
  assert.match(solved.message ?? "", /猜对了/u);
  assert.match(solved.currentCard?.id ?? "", /^zh-CN-/u);
  assert.ok(serverGame.buildScore(solved, activeContext).every((entry) => entry.reason === "禁词挑战得分"));

  const violation = serverGame.handleInput(
    active,
    {
      type: "buzzwort_violation",
      playerId: watcherId,
      sentAt: activeContext.now,
      pressedAt: activeContext.now
    },
    activeContext
  );
  assert.match(violation.message ?? "", /违规/u);
});

test("the controller model localizes roles, actions, feed, stats, and private-card hints", () => {
  const { context, inputs } = controllerContext(sampleControllerState());
  const model = controllerGame.buildLayout(context);

  assert.equal(model.title, "禁词挑战");
  assert.equal(model.statusLabel, "进行中");
  assert.equal(model.roleLabel, "讲解员");
  assert.match(model.helperText ?? "", /点击猜中的玩家/u);
  assert.equal(model.targetsTitle, "谁猜中了？");
  assert.deepEqual(model.stats?.map((entry) => entry.label), ["本回合", "总计", "角色"]);
  assert.equal(model.feedTitle, "最近动态");
  assert.ok(model.feed?.some((entry) => entry.text.includes("已跳过")));
  assert.ok(model.feed?.some((entry) => entry.text.includes("违规")));
  assert.ok(model.actions?.some((action) => action.label.includes("跳过")));

  model.targets?.[0]?.onSelect();
  assert.deepEqual(inputs[0], {
    type: "buzzwort_correct",
    playerId: "p1",
    sentAt: inputs[0].sentAt,
    pressedAt: inputs[0].pressedAt,
    guessedPlayerId: "p3"
  });

  const watcherState = sampleControllerState({
    role: "watcher",
    roleLabel: "监督员",
    isExplainer: false,
    isWatcher: true,
    currentTurnPlayerId: "p3",
    currentWatcherPlayerId: "p1",
    guessTargetPlayerIds: []
  });
  const watcher = controllerGame.buildLayout(controllerContext(watcherState).context);
  assert.equal(watcher.card?.tag, "监督员视角");
  assert.ok(watcher.actions?.some((action) => action.label.includes("违规")));

  const hidden = controllerGame.buildLayout(
    controllerContext(
      sampleControllerState({
        role: "guesser",
        roleLabel: "猜词者",
        isExplainer: false,
        isWatcher: false,
        card: undefined,
        currentTurnPlayerId: "p3",
        currentWatcherPlayerId: "p2",
        guessTargetPlayerIds: []
      })
    ).context
  );
  assert.match(hidden.hiddenCardHint ?? "", /只有/u);
  assert.doesNotMatch(hidden.hiddenCardHint ?? "", /雨伞/u);
});

test("the controller provides Chinese ready-for-next-round copy", () => {
  const { context, readyChanges } = controllerContext(sampleControllerState(), {
    state: {
      game: { phase: "finished", message: "本轮结束。", state: sampleControllerState() }
    }
  });
  const model = controllerGame.buildLayout(context);

  assert.equal(model.ready?.label, "下一轮");
  assert.match(model.ready?.description ?? "", /名玩家已准备/u);
  model.ready?.onToggleReady();
  assert.deepEqual(readyChanges, [true]);
});

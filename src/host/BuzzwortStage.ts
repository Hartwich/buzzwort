// Modified for LAN Party Hub; see CHANGES.md and NOTICE.md.
import Phaser from "phaser";
import {
  localizeBuzzwort,
  resolveBuzzwortLanguage,
  type BuzzwortLanguage,
  type ResolvedBuzzwortLanguage
} from "../language.js";
import type { BuzzwortControllerState, BuzzwortEvent, BuzzwortTeamId } from "../protocol.js";
import { hostTheme } from "./theme.js";
import { BUZZWORT_HUD_HEIGHT } from "./BuzzwortHud.js";

export interface BuzzwortStageModel {
  state?: BuzzwortControllerState;
  playerNames: Map<string, string>;
  playerCount: number;
  message?: string;
  language?: BuzzwortLanguage;
}

const RING_RADIUS = 116;
const RING_WIDTH = 16;
const MAX_SCORE_ROWS = 8;
const MAX_FEED_ROWS = 6;

interface ScoreRow {
  background: Phaser.GameObjects.Graphics;
  name: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
}

interface TeamPanel {
  background: Phaser.GameObjects.Graphics;
  title: Phaser.GameObjects.Text;
  score: Phaser.GameObjects.Text;
  members: Phaser.GameObjects.Text;
  teamId: BuzzwortTeamId;
}

function easeRatio(remainingMs: number | null, durationMs: number): number {
  if (remainingMs === null) {
    return 0;
  }

  return Math.max(0, Math.min(1, remainingMs / Math.max(1, durationMs)));
}

/**
 * Hauptbuehne des Host-Screens. Alle Objekte werden einmal angelegt und danach
 * nur aktualisiert, damit Timer und Effekte fluessig laufen.
 */
export class BuzzwortStage {
  private readonly scene: Phaser.Scene;
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly ringBase: Phaser.GameObjects.Graphics;
  private readonly ringProgress: Phaser.GameObjects.Graphics;
  private readonly ringFlash: Phaser.GameObjects.Graphics;
  private readonly ringValue: Phaser.GameObjects.Text;
  private readonly ringCaption: Phaser.GameObjects.Text;
  private readonly phaseBadge: Phaser.GameObjects.Graphics;
  private readonly phaseLabel: Phaser.GameObjects.Text;
  private readonly explainerLabel: Phaser.GameObjects.Text;
  private readonly explainerName: Phaser.GameObjects.Text;
  private readonly watcherLine: Phaser.GameObjects.Text;
  private readonly cardBack: Phaser.GameObjects.Graphics;
  private readonly cardHint: Phaser.GameObjects.Text;
  private readonly turnCounter: Phaser.GameObjects.Text;
  private readonly messageBanner: Phaser.GameObjects.Graphics;
  private readonly messageText: Phaser.GameObjects.Text;
  private readonly scoreTitle: Phaser.GameObjects.Text;
  private readonly feedTitle: Phaser.GameObjects.Text;
  private readonly scoreRows: ScoreRow[] = [];
  private readonly teamPanels: TeamPanel[] = [];
  private readonly feedRows: Phaser.GameObjects.Text[] = [];
  private readonly popText: Phaser.GameObjects.Text;

  private centerX = 0;
  private ringY = 0;
  private lastEventId?: string;
  private flashUntil = 0;
  private flashColor: number = hostTheme.positive;
  private lastRingColor = "";
  private nextSlowUpdateAt = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.background = scene.add.graphics().setDepth(0);

    this.ringBase = scene.add.graphics().setDepth(4);
    this.ringFlash = scene.add.graphics().setDepth(3);
    this.ringProgress = scene.add.graphics().setDepth(5);

    this.ringValue = scene.add
      .text(0, 0, "--", {
        fontFamily: hostTheme.titleFont,
        fontSize: "76px",
        color: hostTheme.text
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.ringCaption = scene.add
      .text(0, 0, "", {
        fontFamily: hostTheme.bodyFont,
        fontSize: "15px",
        color: hostTheme.dim
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.phaseBadge = scene.add.graphics().setDepth(5);
    this.phaseLabel = scene.add
      .text(0, 0, "", {
        fontFamily: hostTheme.bodyFont,
        fontSize: "15px",
        color: hostTheme.text
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.explainerLabel = scene.add
      .text(0, 0, "", {
        fontFamily: hostTheme.bodyFont,
        fontSize: "14px",
        color: hostTheme.dim
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.explainerName = scene.add
      .text(0, 0, "", {
        fontFamily: hostTheme.titleFont,
        fontSize: "40px",
        color: hostTheme.text
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.watcherLine = scene.add
      .text(0, 0, "", {
        fontFamily: hostTheme.bodyFont,
        fontSize: "17px",
        color: hostTheme.muted
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.cardBack = scene.add.graphics().setDepth(4);
    this.cardHint = scene.add
      .text(0, 0, "", {
        fontFamily: hostTheme.bodyFont,
        fontSize: "16px",
        color: hostTheme.muted,
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.turnCounter = scene.add
      .text(0, 0, "", {
        fontFamily: hostTheme.monoFont,
        fontSize: "16px",
        color: hostTheme.dim
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.messageBanner = scene.add.graphics().setDepth(4);
    this.messageText = scene.add
      .text(0, 0, "", {
        fontFamily: hostTheme.bodyFont,
        fontSize: "20px",
        color: hostTheme.text,
        align: "center"
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.scoreTitle = scene.add
      .text(0, 0, "", {
        fontFamily: hostTheme.bodyFont,
        fontSize: "13px",
        color: hostTheme.dim
      })
      .setDepth(6);
    this.feedTitle = scene.add
      .text(0, 0, "", {
        fontFamily: hostTheme.bodyFont,
        fontSize: "13px",
        color: hostTheme.dim
      })
      .setDepth(6);

    for (let index = 0; index < MAX_SCORE_ROWS; index += 1) {
      this.scoreRows.push({
        background: scene.add.graphics().setDepth(4),
        name: scene.add
          .text(0, 0, "", { fontFamily: hostTheme.bodyFont, fontSize: "18px", color: hostTheme.text })
          .setOrigin(0, 0.5)
          .setDepth(6),
        value: scene.add
          .text(0, 0, "", { fontFamily: hostTheme.titleFont, fontSize: "22px", color: hostTheme.css.accent })
          .setOrigin(1, 0.5)
          .setDepth(6)
      });
    }

    for (const teamId of ["team1", "team2"] as const) {
      this.teamPanels.push({
        teamId,
        background: scene.add.graphics().setDepth(4),
        title: scene.add
          .text(0, 0, "", { fontFamily: hostTheme.bodyFont, fontSize: "16px", color: hostTheme.muted })
          .setDepth(6),
        score: scene.add
          .text(0, 0, "", { fontFamily: hostTheme.titleFont, fontSize: "56px", color: hostTheme.text })
          .setOrigin(1, 0)
          .setDepth(6),
        members: scene.add
          .text(0, 0, "", {
            fontFamily: hostTheme.bodyFont,
            fontSize: "14px",
            color: hostTheme.dim,
            wordWrap: { width: 240 }
          })
          .setDepth(6)
      });
    }

    for (let index = 0; index < MAX_FEED_ROWS; index += 1) {
      this.feedRows.push(
        scene.add
          .text(0, 0, "", {
            fontFamily: hostTheme.bodyFont,
            fontSize: "16px",
            color: hostTheme.muted,
            wordWrap: { width: 280 }
          })
          .setDepth(6)
      );
    }

    this.popText = scene.add
      .text(0, 0, "", { fontFamily: hostTheme.titleFont, fontSize: "44px", color: "#4ade80" })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);

    this.layout();
  }

  layout(): void {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const top = BUZZWORT_HUD_HEIGHT;
    const sideWidth = Math.min(320, Math.max(240, width * 0.24));

    this.centerX = width / 2;
    this.ringY = top + 40 + RING_RADIUS;

    this.background.clear();
    this.background.fillGradientStyle(
      hostTheme.backgroundTop,
      hostTheme.backgroundTop,
      hostTheme.backgroundBottom,
      hostTheme.backgroundBottom,
      1
    );
    this.background.fillRect(0, 0, width, height);
    this.background.fillStyle(hostTheme.accent, 0.05);
    this.background.fillCircle(this.centerX, this.ringY, RING_RADIUS + 90);

    this.ringValue.setPosition(this.centerX, this.ringY - 8);
    this.ringCaption.setPosition(this.centerX, this.ringY + 40);

    const phaseY = top + 12;
    this.phaseBadge.clear();
    this.phaseLabel.setPosition(this.centerX, phaseY + 14);

    this.explainerLabel.setPosition(this.centerX, this.ringY + RING_RADIUS + 26);
    this.explainerName.setPosition(this.centerX, this.ringY + RING_RADIUS + 60);
    this.watcherLine.setPosition(this.centerX, this.ringY + RING_RADIUS + 96);

    const cardWidth = Math.min(420, width - sideWidth * 2 - 120);
    const cardHeight = 96;
    const cardX = this.centerX - cardWidth / 2;
    const cardY = this.ringY + RING_RADIUS + 122;

    this.cardBack.clear();
    this.cardBack.fillStyle(hostTheme.surface, 0.85);
    this.cardBack.fillRoundedRect(cardX, cardY, cardWidth, cardHeight, 14);
    this.cardBack.lineStyle(1.5, hostTheme.outline, 0.9);
    this.cardBack.strokeRoundedRect(cardX, cardY, cardWidth, cardHeight, 14);
    this.cardBack.lineStyle(1, hostTheme.outlineSoft, 0.5);

    for (let offset = -cardHeight; offset < cardWidth; offset += 18) {
      this.cardBack.lineBetween(cardX + offset, cardY + cardHeight, cardX + offset + cardHeight, cardY);
    }

    this.cardHint.setPosition(this.centerX, cardY + cardHeight / 2 - 8);
    this.cardHint.setWordWrapWidth(cardWidth - 32);
    this.turnCounter.setPosition(this.centerX, cardY + cardHeight / 2 + 22);

    const bannerHeight = 58;
    const bannerWidth = Math.min(width - 80, 900);
    const bannerX = this.centerX - bannerWidth / 2;
    const bannerY = height - bannerHeight - 28;

    this.messageBanner.clear();
    this.messageBanner.fillStyle(hostTheme.surfaceSoft, 0.85);
    this.messageBanner.fillRoundedRect(bannerX, bannerY, bannerWidth, bannerHeight, 12);
    this.messageBanner.lineStyle(1, hostTheme.outline, 0.8);
    this.messageBanner.strokeRoundedRect(bannerX, bannerY, bannerWidth, bannerHeight, 12);

    this.messageText.setPosition(this.centerX, bannerY + bannerHeight / 2);
    this.messageText.setWordWrapWidth(bannerWidth - 48);

    this.layoutSide(sideWidth, top, height);
    this.popText.setPosition(this.centerX + RING_RADIUS + 40, this.ringY);
  }

  private layoutSide(sideWidth: number, top: number, height: number): void {
    const width = this.scene.scale.width;
    const leftX = 40;
    const rightX = width - sideWidth - 40;

    this.scoreTitle.setPosition(leftX, top + 24);
    this.feedTitle.setPosition(rightX, top + 24);

    this.teamPanels.forEach((panel, index) => {
      const panelY = top + 52 + index * 148;

      panel.background.clear();
      panel.background.fillStyle(hostTheme.surface, 0.8);
      panel.background.fillRoundedRect(leftX, panelY, sideWidth, 132, 14);
      panel.background.lineStyle(2, panel.teamId === "team1" ? hostTheme.team1 : hostTheme.team2, 0.55);
      panel.background.strokeRoundedRect(leftX, panelY, sideWidth, 132, 14);

      panel.title.setPosition(leftX + 18, panelY + 16);
      panel.score.setPosition(leftX + sideWidth - 18, panelY + 6);
      panel.members.setPosition(leftX + 18, panelY + 58);
      panel.members.setWordWrapWidth(sideWidth - 36);
    });

    this.scoreRows.forEach((row, index) => {
      const rowY = top + 52 + index * 46;

      row.background.clear();
      row.background.fillStyle(hostTheme.surface, 0.72);
      row.background.fillRoundedRect(leftX, rowY, sideWidth, 38, 10);

      row.name.setPosition(leftX + 14, rowY + 19);
      row.value.setPosition(leftX + sideWidth - 14, rowY + 19);
    });

    this.feedRows.forEach((row, index) => {
      row.setPosition(rightX, top + 52 + index * 46);
      row.setWordWrapWidth(sideWidth);
    });

    void height;
  }

  update(model: BuzzwortStageModel, now: number): void {
    const state = model.state;
    const language = resolveBuzzwortLanguage(model.language);

    // Der Ring laeuft jeden Frame, der Rest reicht mit ~10 Hz.
    this.updateRing(state, now, language);
    this.detectEvents(state, now, language);
    this.updateFlash(now);

    if (now < this.nextSlowUpdateAt) {
      return;
    }

    this.nextSlowUpdateAt = now + 100;
    this.updateCenter(state, model, language);
    this.updateSide(state, model, language);
    this.updateMessage(model, language);
  }

  private updateRing(
    state: BuzzwortControllerState | undefined,
    now: number,
    language: ResolvedBuzzwortLanguage
  ): void {
    const text = <T>(zhCn: T, en: T, de: T) => localizeBuzzwort(language, zhCn, en, de);
    const active = state?.turnPhase === "active" && state.turnEndsAt !== null;
    const preview = state?.turnPhase === "preview";
    const remaining = active
      ? Math.max(0, (state?.turnEndsAt ?? now) - now)
      : preview
        ? state?.turnPhaseRemainingMs ?? null
        : null;
    const duration = active ? state?.turnDurationMs ?? 60_000 : 4_000;
    const ratio = active || preview ? easeRatio(remaining, duration) : 0;
    const seconds = remaining === null ? null : Math.ceil(remaining / 1000);
    const urgent = active && remaining !== null && remaining <= 10_000;
    const color = preview ? hostTheme.accent : urgent ? hostTheme.danger : ratio > 0.4 ? hostTheme.positive : hostTheme.warning;

    this.ringBase.clear();
    this.ringBase.lineStyle(RING_WIDTH, hostTheme.outlineSoft, 0.85);
    this.ringBase.strokeCircle(this.centerX, this.ringY, RING_RADIUS);

    this.ringProgress.clear();

    if (ratio > 0) {
      this.ringProgress.lineStyle(RING_WIDTH, color, 1);
      this.ringProgress.beginPath();
      this.ringProgress.arc(
        this.centerX,
        this.ringY,
        RING_RADIUS,
        Phaser.Math.DegToRad(-90),
        Phaser.Math.DegToRad(-90 + 360 * ratio),
        false
      );
      this.ringProgress.strokePath();
    }

    const pulse = urgent ? 1 + Math.sin(now / 120) * 0.05 : 1;
    this.ringValue.setScale(pulse);
    this.ringValue.setText(seconds === null ? "–" : `${seconds}`);

    const ringColor = `#${color.toString(16).padStart(6, "0")}`;

    if (ringColor !== this.lastRingColor) {
      this.lastRingColor = ringColor;
      this.ringValue.setColor(ringColor);
    }

    this.ringCaption.setText(
      preview
        ? text("即将开始", "starting", "Start gleich")
        : active
          ? text("剩余（秒）", "seconds left", "Sekunden übrig")
          : text("等待中", "waiting", "Pause")
    );
  }

  private updateCenter(
    state: BuzzwortControllerState | undefined,
    model: BuzzwortStageModel,
    language: ResolvedBuzzwortLanguage
  ): void {
    const text = <T>(zhCn: T, en: T, de: T) => localizeBuzzwort(language, zhCn, en, de);
    const phaseText = !state
      ? text("大厅", "Lobby", "Lobby")
      : state.turnPhase === "preview"
        ? text("准备开始", "GET READY", "BEREIT MACHEN")
        : state.turnPhase === "active"
          ? text("讲解中", "EXPLAINING", "ES LÄUFT")
          : text("本回合结束", "TURN OVER", "ZUG VORBEI");

    this.phaseLabel.setText(phaseText);

    const badgeWidth = Math.max(160, this.phaseLabel.width + 40);
    const badgeX = this.centerX - badgeWidth / 2;
    const badgeY = BUZZWORT_HUD_HEIGHT + 12;
    const badgeColor =
      state?.turnPhase === "active" ? hostTheme.positive : state?.turnPhase === "preview" ? hostTheme.accent : hostTheme.outline;

    this.phaseBadge.clear();
    this.phaseBadge.fillStyle(badgeColor, 0.2);
    this.phaseBadge.fillRoundedRect(badgeX, badgeY, badgeWidth, 28, 14);
    this.phaseBadge.lineStyle(1.2, badgeColor, 0.8);
    this.phaseBadge.strokeRoundedRect(badgeX, badgeY, badgeWidth, 28, 14);

    const explainerName = state?.currentTurnPlayerId
      ? model.playerNames.get(state.currentTurnPlayerId) ?? state.currentTurnPlayerId
      : text("等待玩家", "Waiting for players", "Warte auf Spieler");
    const teamLabel = state?.activeTeamLabel;

    this.explainerLabel.setText(
      teamLabel
        ? `${teamLabel} · ${text("讲解", "explains", "erklärt")}`
        : text("讲解员", "Explainer", "Erklärer")
    );
    this.explainerName.setText(explainerName);
    this.explainerName.setColor(
      state?.currentTurnTeamId === "team2"
        ? hostTheme.css.team2
        : state?.currentTurnTeamId === "team1"
          ? hostTheme.css.team1
          : hostTheme.text
    );

    const watcherName = state?.currentWatcherPlayerId
      ? model.playerNames.get(state.currentWatcherPlayerId) ?? state.currentWatcherPlayerId
      : undefined;

    this.watcherLine.setText(
      watcherName
        ? `🚫 ${text("监督员：", "Watcher: ", "Wächter: ")}${watcherName}`
        : text("本回合没有监督员", "No watcher this turn", "Kein Wächter in diesem Zug")
    );
    this.watcherLine.setColor(watcherName ? hostTheme.css.danger : hostTheme.dim);

    this.cardHint.setText(
      text(
        "目标词只显示在讲解员和监督员的手机上。",
        "The term stays on the explainer's and watcher's phone.",
        "Der Begriff bleibt auf dem Handy von Erklärer und Wächter."
      )
    );

    const solvedThisTurn = state?.turnSolved ?? 0;
    const turnLabel =
      state && state.totalTurns > 0
        ? `${text("回合", "Turn", "Zug")} ${Math.min(state.turnIndex + 1, state.totalTurns)}/${state.totalTurns}`
        : text(`${model.playerCount} 名玩家`, `${model.playerCount} players`, `${model.playerCount} Spieler`);

    this.turnCounter.setText(
      `${turnLabel}   ·   ${text("本回合：", "this turn: ", "dieser Zug: ")}${solvedThisTurn}   ·   ${text("总计：", "total: ", "gesamt: ")}${state?.solvedTerms ?? 0}`
    );
  }

  private updateSide(
    state: BuzzwortControllerState | undefined,
    model: BuzzwortStageModel,
    language: ResolvedBuzzwortLanguage
  ): void {
    const text = <T>(zhCn: T, en: T, de: T) => localizeBuzzwort(language, zhCn, en, de);
    const teamMode = state?.mode === "team";

    this.scoreTitle.setText(teamMode ? text("队伍", "TEAMS", "TEAMS") : text("排行榜", "LEADERBOARD", "RANGLISTE"));
    this.feedTitle.setText(text("实时动态", "LIVE", "LIVE"));

    for (const panel of this.teamPanels) {
      const visible = teamMode;

      panel.background.setVisible(visible);
      panel.title.setVisible(visible);
      panel.score.setVisible(visible);
      panel.members.setVisible(visible);

      if (!visible) {
        continue;
      }

      const isActive = state?.currentTurnTeamId === panel.teamId;
      const memberNames = (state?.teamMembersByTeamId?.[panel.teamId] ?? [])
        .map((playerId) => model.playerNames.get(playerId))
        .filter((name): name is string => Boolean(name));

      panel.title.setText(
        `${panel.teamId === "team1" ? text("一队", "Team 1", "Team 1") : text("二队", "Team 2", "Team 2")}${isActive ? "  ▶" : ""}`
      );
      panel.title.setColor(isActive ? hostTheme.text : hostTheme.muted);
      panel.score.setText(`${state?.scoreByTeamId?.[panel.teamId] ?? 0}`);
      panel.score.setColor(panel.teamId === "team1" ? hostTheme.css.team1 : hostTheme.css.team2);
      panel.members.setText(
        memberNames.length > 0 ? memberNames.join(" · ") : text("暂无玩家", "no players", "keine Spieler")
      );
      panel.background.setAlpha(isActive ? 1 : 0.55);
    }

    const ranked = Object.entries(state?.scoreByPlayerId ?? {})
      .map(([playerId, score]) => ({ playerId, score }))
      .sort((left, right) => right.score - left.score)
      .slice(0, MAX_SCORE_ROWS);

    this.scoreRows.forEach((row, index) => {
      const entry = ranked[index];
      const visible = !teamMode && Boolean(entry);

      row.background.setVisible(visible);
      row.name.setVisible(visible);
      row.value.setVisible(visible);

      if (!entry || teamMode) {
        return;
      }

      const isActive = entry.playerId === state?.currentTurnPlayerId;

      row.name.setText(`${index + 1}. ${model.playerNames.get(entry.playerId) ?? entry.playerId}`);
      row.name.setColor(isActive ? hostTheme.css.accent : hostTheme.text);
      row.value.setText(`${entry.score}`);
      row.value.setColor(hostTheme.css.accent);
      row.background.setAlpha(isActive ? 1 : 0.6);
    });

    const events = state?.events ?? [];

    this.feedRows.forEach((row, index) => {
      const event = events[index];

      if (!event) {
        row.setVisible(false);
        return;
      }

      row.setVisible(true);
      row.setText(this.formatEvent(event, language));
      row.setColor(
        event.kind === "solved"
          ? hostTheme.css.positive
          : event.kind === "buzz"
            ? hostTheme.css.danger
            : event.kind === "turn_start"
              ? hostTheme.css.accent
              : hostTheme.muted
      );
      row.setAlpha(Math.max(0.35, 1 - index * 0.14));
    });
  }

  private formatEvent(event: BuzzwortEvent, language: ResolvedBuzzwortLanguage): string {
    const text = <T>(zhCn: T, en: T, de: T) => localizeBuzzwort(language, zhCn, en, de);

    switch (event.kind) {
      case "solved":
        return text(
          `✅ “${event.term}”  ${event.actorName ?? ""}`,
          `✅ „${event.term}"  ${event.actorName ?? ""}`,
          `✅ „${event.term}"  ${event.actorName ?? ""}`
        );
      case "buzz":
        return `${text("违规", "BUZZ", "BUZZ")}  ${event.actorName ?? ""}`;
      case "skipped":
        return `⏭ ${text("已跳过", "skipped", "übersprungen")}`;
      case "turn_start":
        return text(
          `▶ ${event.actorName ?? ""}${event.targetName ? ` · ${event.targetName} 监督` : ""}`,
          `▶ ${event.actorName ?? ""}${event.targetName ? ` vs ${event.targetName}` : ""}`,
          `▶ ${event.actorName ?? ""}${event.targetName ? ` vs ${event.targetName}` : ""}`
        );
      case "turn_end":
        return `🏁 ${event.actorName ?? ""}${text("：", ": ", ": ")}${event.points ?? 0}`;
      default:
        return "";
    }
  }

  private updateMessage(model: BuzzwortStageModel, language: ResolvedBuzzwortLanguage): void {
    const text = model.message ?? model.state?.lastTurnSummary;

    this.messageText.setText(
      text ?? localizeBuzzwort(language, "等待下一回合。", "Waiting for the next turn.", "Warte auf den nächsten Zug.")
    );
  }

  private detectEvents(
    state: BuzzwortControllerState | undefined,
    now: number,
    language: ResolvedBuzzwortLanguage
  ): void {
    const newest = state?.events?.[0];

    if (!newest || newest.id === this.lastEventId) {
      return;
    }

    const isFirst = this.lastEventId === undefined;
    this.lastEventId = newest.id;

    if (isFirst) {
      return;
    }

    if (newest.kind === "solved") {
      this.flashColor = hostTheme.positive;
      this.flashUntil = now + 700;
      this.spawnPop("+1", "#4ade80");
      return;
    }

    if (newest.kind === "buzz") {
      this.flashColor = hostTheme.danger;
      this.flashUntil = now + 900;
      this.spawnPop(localizeBuzzwort(language, "违规！", "BUZZ!", "BUZZ!"), "#f87171");
      return;
    }

    if (newest.kind === "skipped") {
      this.flashColor = hostTheme.warning;
      this.flashUntil = now + 450;
    }
  }

  private spawnPop(text: string, color: string): void {
    this.popText.setText(text);
    this.popText.setColor(color);
    this.popText.setAlpha(1);
    this.popText.setScale(0.7);
    this.popText.setPosition(this.centerX + RING_RADIUS + 60, this.ringY);

    this.scene.tweens.killTweensOf(this.popText);
    this.scene.tweens.add({
      targets: this.popText,
      y: this.ringY - 60,
      alpha: 0,
      scale: 1.25,
      duration: 900,
      ease: "Cubic.easeOut"
    });
  }

  private updateFlash(now: number): void {
    this.ringFlash.clear();

    if (now >= this.flashUntil) {
      return;
    }

    const strength = (this.flashUntil - now) / 900;

    this.ringFlash.lineStyle(RING_WIDTH + 22, this.flashColor, Math.max(0, Math.min(0.5, strength * 0.5)));
    this.ringFlash.strokeCircle(this.centerX, this.ringY, RING_RADIUS);
  }
}

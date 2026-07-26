import Phaser from "phaser";
import type { SupportedLanguage } from "@open-party-lab/game-core";
import type { BuzzwortMode } from "../protocol.js";
import { hostTheme } from "./theme.js";

export interface BuzzwortHudCallbacks {
  onSelectMode: (mode: BuzzwortMode) => void;
  onToggleWatcher: (enabled: boolean) => void;
  onSelectDuration: (durationMs: number) => void;
}

export interface BuzzwortHudModel {
  roomCode: string;
  mode: BuzzwortMode;
  watcherEnabled: boolean;
  turnDurationMs: number;
  locked: boolean;
  language?: SupportedLanguage;
}

interface Chip {
  background: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  zone: Phaser.GameObjects.Zone;
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  accent: number;
}

const CHIP_HEIGHT = 38;

export const BUZZWORT_HUD_HEIGHT = 132;

/**
 * Kopfzeile des Host-Screens mit den Raumeinstellungen.
 * Die Objekte werden einmal erzeugt und danach nur noch umgefaerbt.
 */
export class BuzzwortHud {
  private readonly scene: Phaser.Scene;
  private readonly callbacks: BuzzwortHudCallbacks;
  private readonly container: Phaser.GameObjects.Container;
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly roomLabel: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly chips = new Map<string, Chip>();
  private lockedNotice?: Phaser.GameObjects.Text;
  private width: number;

  constructor(scene: Phaser.Scene, callbacks: BuzzwortHudCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;
    this.width = scene.scale.width;
    this.container = scene.add.container(0, 0).setDepth(20);

    this.background = scene.add.graphics();
    this.container.add(this.background);

    this.roomLabel = scene.add.text(40, 26, "", {
      fontFamily: hostTheme.monoFont,
      fontSize: "18px",
      color: hostTheme.dim
    });
    this.title = scene.add.text(40, 46, "BUZZWORT", {
      fontFamily: hostTheme.titleFont,
      fontSize: "40px",
      color: hostTheme.text
    });
    this.hint = scene.add.text(40, 96, "", {
      fontFamily: hostTheme.bodyFont,
      fontSize: "14px",
      color: hostTheme.dim
    });
    this.container.add([this.roomLabel, this.title, this.hint]);

    this.buildChips();
    this.layout();
  }

  private buildChips(): void {
    this.createChip("mode:duel", 168, hostTheme.accent, () => this.callbacks.onSelectMode("duel"));
    this.createChip("mode:team", 128, hostTheme.accent, () => this.callbacks.onSelectMode("team"));
    this.createChip("watcher", 150, hostTheme.danger, () => this.callbacks.onToggleWatcher(true));
    this.createChip("time:45000", 62, hostTheme.warning, () => this.callbacks.onSelectDuration(45_000));
    this.createChip("time:60000", 62, hostTheme.warning, () => this.callbacks.onSelectDuration(60_000));
    this.createChip("time:90000", 62, hostTheme.warning, () => this.callbacks.onSelectDuration(90_000));
  }

  private createChip(id: string, width: number, accent: number, onClick: () => void): void {
    const background = this.scene.add.graphics();
    const label = this.scene.add
      .text(0, 0, "", {
        fontFamily: hostTheme.bodyFont,
        fontSize: "14px",
        color: hostTheme.text,
        align: "center"
      })
      .setOrigin(0.5);
    const zone = this.scene.add.zone(0, 0, width, CHIP_HEIGHT).setOrigin(0).setInteractive({ useHandCursor: true });

    zone.on("pointerdown", () => {
      const chip = this.chips.get(id);

      if (chip && !chip.zone.input?.enabled) {
        return;
      }

      onClick();
    });

    this.container.add([background, label, zone]);
    this.chips.set(id, { background, label, zone, x: 0, y: 0, width, height: CHIP_HEIGHT, active: false, accent });
  }

  private drawChip(chip: Chip): void {
    const fill = chip.active ? chip.accent : hostTheme.surface;
    const alpha = chip.active ? 0.28 : 0.75;

    chip.background.clear();
    chip.background.fillStyle(fill, alpha);
    chip.background.fillRoundedRect(chip.x, chip.y, chip.width, chip.height, 10);
    chip.background.lineStyle(1.5, chip.active ? chip.accent : hostTheme.outline, chip.active ? 1 : 0.7);
    chip.background.strokeRoundedRect(chip.x, chip.y, chip.width, chip.height, 10);

    chip.label.setPosition(chip.x + chip.width / 2, chip.y + chip.height / 2);
    chip.label.setColor(chip.active ? hostTheme.text : hostTheme.muted);
    chip.zone.setPosition(chip.x, chip.y);
  }

  private positionChip(id: string, x: number, y: number): number {
    const chip = this.chips.get(id);

    if (!chip) {
      return x;
    }

    chip.x = x;
    chip.y = y;
    this.drawChip(chip);

    return x + chip.width + 8;
  }

  layout(): void {
    this.width = this.scene.scale.width;

    this.background.clear();
    this.background.fillStyle(hostTheme.surface, 0.5);
    this.background.fillRect(0, 0, this.width, BUZZWORT_HUD_HEIGHT);
    this.background.lineStyle(1, hostTheme.outlineSoft, 0.9);
    this.background.lineBetween(0, BUZZWORT_HUD_HEIGHT, this.width, BUZZWORT_HUD_HEIGHT);

    const right = this.width - 40;
    const rowOneWidth =
      (this.chips.get("mode:duel")?.width ?? 0) +
      (this.chips.get("mode:team")?.width ?? 0) +
      (this.chips.get("watcher")?.width ?? 0) +
      16;
    let cursor = right - rowOneWidth;

    cursor = this.positionChip("mode:duel", cursor, 26);
    cursor = this.positionChip("mode:team", cursor, 26);
    this.positionChip("watcher", cursor, 26);

    const rowTwoWidth = 62 * 3 + 16;
    let timeCursor = right - rowTwoWidth;

    timeCursor = this.positionChip("time:45000", timeCursor, 74);
    timeCursor = this.positionChip("time:60000", timeCursor, 74);
    this.positionChip("time:90000", timeCursor, 74);

    this.lockedNotice?.setPosition(right, 118);
  }

  update(model: BuzzwortHudModel): void {
    const en = model.language === "en";

    this.roomLabel.setText(`${en ? "ROOM" : "RAUM"} ${model.roomCode}`);
    this.hint.setText(
      model.locked
        ? en
          ? "Settings are locked while a round is running."
          : "Einstellungen sind während einer laufenden Runde gesperrt."
        : en
          ? "Pick mode, watcher and turn length before you start."
          : "Modus, Wächter und Zuglänge vor dem Start wählen."
    );

    this.setChip("mode:duel", en ? "Free-for-all" : "Jeder gegen jeden", model.mode === "duel", model.locked);
    this.setChip("mode:team", en ? "Team mode" : "Teammodus", model.mode === "team", model.locked);

    const watcherLocked = model.locked || model.mode === "team";
    this.setChip(
      "watcher",
      model.watcherEnabled
        ? en
          ? "Watcher: on"
          : "Wächter: an"
        : en
          ? "Watcher: off"
          : "Wächter: aus",
      model.watcherEnabled,
      watcherLocked
    );

    const watcherChip = this.chips.get("watcher");

    if (watcherChip) {
      watcherChip.zone.removeAllListeners("pointerdown");
      watcherChip.zone.on("pointerdown", () => {
        if (watcherLocked) {
          return;
        }

        this.callbacks.onToggleWatcher(!model.watcherEnabled);
      });
    }

    for (const durationMs of [45_000, 60_000, 90_000]) {
      this.setChip(
        `time:${durationMs}`,
        `${durationMs / 1000}s`,
        model.turnDurationMs === durationMs,
        model.locked
      );
    }
  }

  private setChip(id: string, label: string, active: boolean, disabled: boolean): void {
    const chip = this.chips.get(id);

    if (!chip) {
      return;
    }

    chip.label.setText(label);
    chip.active = active;
    chip.background.setAlpha(disabled ? 0.45 : 1);
    chip.label.setAlpha(disabled ? 0.5 : 1);

    if (disabled) {
      chip.zone.disableInteractive();
    } else {
      chip.zone.setInteractive({ useHandCursor: true });
    }

    this.drawChip(chip);
  }

  destroy(): void {
    this.container.destroy(true);
  }
}

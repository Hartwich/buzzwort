// Modified for LAN Party Hub; see CHANGES.md and NOTICE.md.
import Phaser from "phaser";
import { buzzwortManifest } from "../manifest.js";
import type { BuzzwortLanguage } from "../language.js";
import type { BuzzwortControllerState, BuzzwortMode } from "../protocol.js";
import { hostTheme } from "./theme.js";
import { BuzzwortHud } from "./BuzzwortHud.js";
import { BuzzwortStage } from "./BuzzwortStage.js";

interface HostClientLike {
  subscribe(callback: (state: HostAppStateLike) => void): () => void;
  sendGameHostAction(gameId: string, action: unknown): void;
}

interface HostAppStateLike {
  game?: {
    phase?: string;
    message?: string;
    state?: unknown;
  } | null;
  room?: {
    code?: string;
    language?: BuzzwortLanguage;
    players?: Array<{ id: string; name: string }>;
    settings?: Record<string, unknown>;
  } | null;
}

const RUNNING_PHASES = new Set(["playing", "countdown", "locked"]);

export class BuzzwortHostScene extends Phaser.Scene {
  private unsubscribe?: () => void;
  private hud?: BuzzwortHud;
  private stage?: BuzzwortStage;

  private selectedMode: BuzzwortMode = "duel";
  private watcherEnabled = true;
  private turnDurationMs = 60_000;

  private latest: HostAppStateLike = {};
  private playerNames = new Map<string, string>();

  constructor() {
    super(buzzwortManifest.hostView);
  }

  create(): void {
    const client = this.registry.get("hostClient") as HostClientLike;

    this.cameras.main.setBackgroundColor(hostTheme.panel);

    this.hud = new BuzzwortHud(this, {
      onSelectMode: (mode) => {
        this.selectedMode = mode;
        client.sendGameHostAction("buzzwort", { type: "set_mode", mode });
        this.refreshHud();
      },
      onToggleWatcher: (enabled) => {
        this.watcherEnabled = enabled;
        client.sendGameHostAction("buzzwort", { type: "set_watcher", watcherEnabled: enabled });
        this.refreshHud();
      },
      onSelectDuration: (durationMs) => {
        this.turnDurationMs = durationMs;
        client.sendGameHostAction("buzzwort", { type: "set_turn_duration", turnDurationMs: durationMs });
        this.refreshHud();
      }
    });

    this.stage = new BuzzwortStage(this);

    this.unsubscribe = client.subscribe((state) => {
      this.latest = state;
      this.playerNames = new Map((state.room?.players ?? []).map((player) => [player.id, player.name]));

      const gameState = state.game?.state as BuzzwortControllerState | undefined;

      if (gameState?.mode) {
        this.selectedMode = gameState.mode;
      }

      if (typeof gameState?.watcherEnabled === "boolean") {
        this.watcherEnabled = gameState.watcherEnabled;
      }

      if (typeof gameState?.turnDurationMs === "number" && gameState.turnDurationMs > 0) {
        this.turnDurationMs = gameState.turnDurationMs;
      }

      this.refreshHud();
    });

    const onResize = () => {
      this.hud?.layout();
      this.stage?.layout();
    };

    this.scale.on(Phaser.Scale.Events.RESIZE, onResize);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, onResize);
      this.unsubscribe?.();
      this.unsubscribe = undefined;
      this.hud?.destroy();
      this.hud = undefined;
      this.stage = undefined;
    });

    this.refreshHud();
  }

  private refreshHud(): void {
    const phase = this.latest.game?.phase;

    this.hud?.update({
      roomCode: this.latest.room?.code ?? "----",
      mode: this.selectedMode,
      watcherEnabled: this.selectedMode === "team" ? true : this.watcherEnabled,
      turnDurationMs: this.turnDurationMs,
      locked: Boolean(phase && RUNNING_PHASES.has(phase)),
      language: this.latest.room?.language
    });
  }

  update(time: number): void {
    this.stage?.update(
      {
        state: this.latest.game?.state as BuzzwortControllerState | undefined,
        playerNames: this.playerNames,
        playerCount: this.latest.room?.players?.length ?? 0,
        message: this.latest.game?.message,
        language: this.latest.room?.language
      },
      Date.now()
    );

    void time;
  }
}

export const hostGame = {
  id: buzzwortManifest.id,
  displayName: buzzwortManifest.displayName,
  sceneKey: buzzwortManifest.hostView,
  scene: BuzzwortHostScene
} as const;

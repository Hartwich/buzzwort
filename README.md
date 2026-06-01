# Tabu

Taboo-inspired word explanation game for Open Party Lab with team and party flow.

![In-game screenshot](docs/screenshots/host.png)

## Status

Alpha. The explanation and scoring loop is playable. Needs word-list rights review, content expansion, and balance passes.

## Run Through Open Party Lab

This repo is not a standalone app. Run it through the Open Party Lab platform.

Recommended layout:

```text
Open-Party-Lab/
  local-games/
    tabu/
```

From the Platform repo:

```bash
npm install
npm run games:sync-local
npm run dev:all
```

The Platform loads this game only when the repo exists locally and `npm run games:sync-local` links it. Missing optional games are skipped.

## GitHub Metadata

Description:

```text
Taboo-inspired word explanation game for Open Party Lab with team and party flow.
```

Suggested topics:

```text
open-party-lab party-game browser-game phaser typescript local-multiplayer word-game
```

## Package Entrypoints

- `@open-party-lab/game-tabu/manifest`
- `@open-party-lab/game-tabu/protocol`
- `@open-party-lab/game-tabu/server`
- `@open-party-lab/game-tabu/host`
- `@open-party-lab/game-tabu/controller`

The Platform should import only these public entrypoints.

## Development Checks

```bash
npm install
npm run typecheck
npm run build
npm run pack:dry-run
```

For visual checks, start Open Party Lab, add virtual controllers when needed, and capture host screenshots through a browser.

## License

Code is licensed under the Apache License 2.0. See [LICENSE](LICENSE).

Assets, generated media, word lists, prompts, and third-party references may need separate rights review before public store distribution.

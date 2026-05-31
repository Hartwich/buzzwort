# Open Party Lab: Tabu

Tabu is an optional Open Party Lab game package. Players explain terms while avoiding forbidden words, either free-for-all or in teams.

## Local Development

```bash
npm install
npm run typecheck
npm run build
```

For local Platform integration, run this in the Party Platform repo:

```bash
cd ../..
npm run games:sync-local
npm run dev:all
```

The Platform links only game repos that exist locally. If this repo is not present, Tabu is skipped.

## Public Entrypoints

```text
@open-party-lab/game-tabu/manifest
@open-party-lab/game-tabu/protocol
@open-party-lab/game-tabu/server
@open-party-lab/game-tabu/host
@open-party-lab/game-tabu/controller
```


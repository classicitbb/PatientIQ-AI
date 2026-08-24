# Project Knowledge

- Repository: `classicitbb/PatientIQ-AI`
- Default branch: `main`
- Visibility: `public`
- Last verified: 2026-08-24
- Business owner: Russell Hunte
- Existing instructions: none detected
- Existing status ledger: none detected

## Purpose

<div align="center">

## Verified stack

- React (^19.0.1)
- Vite (^6.2.3)
- TypeScript (~5.8.2)
- Tailwind CSS (^4.1.14)
- Express (^4.21.2)

- Vercel project linkage verified: `patient-iq-ai`.

## Commands

| Script | Command | Implementation |
|---|---|---|
| dev | `npm run dev` | `tsx server.ts` |
| build | `npm run build` | `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` |
| start | `npm run start` | `node dist/server.cjs` |
| clean | `npm run clean` | `rm -rf dist server.js` |
| lint | `npm run lint` | `tsc --noEmit` |

Commands are discovered from the manifest and were not run during this rollout. Use the committed lockfile/package manager.

## Environment-variable names

Use the repository environment example as the name registry; do not duplicate private configuration in this public file.

Record names and purpose only. Update this file when code, configuration, architecture, or the project’s operational status changes.

## Sources of truth

- Code: this repository.
- Commands: manifests/lockfiles.
- Current work: `docs/agent/HANDOFF.md`.
- Rules: continuity override.
- Hosting: `patient-iq-ai` linkage verified.
- Data/schema: needs verification.

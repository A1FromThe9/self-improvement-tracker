# Grind

A self-improvement tracker that plays like a game. Missions, XP, ranks, combo multipliers, streaks and trophies for the things that actually matter.

Mobile-first PWA. Install it from Safari with Share, then "Add to Home Screen" and it runs fullscreen like a native app, fully offline.

## How it works

- **Missions** are your habits. Each one has a life area (Body, Mind, Money, Craft, Discipline, Social), a difficulty that sets its XP payout, and a weekly schedule.
- **Combo heat**: every mission you complete in a day raises the multiplier for the next one, up to x2. Stack your day.
- **Levels and ranks**: XP feeds a level curve from Rookie all the way to Legend. Level-ups get the full celebration.
- **Character stats**: each life area levels up separately, GTA style.
- **Streaks and trophies**: consecutive days build your streak; 16 trophies to unlock.

## Your data

Everything is stored on-device in IndexedDB. No account, no server, no tracking, free forever. Use Export in the Profile tab to back up as JSON and Import to restore on another device.

## Development

```bash
npm install
npm run dev       # local dev server
npm test          # game logic unit tests
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Deploying to Vercel

Import the repo in Vercel and deploy. It is auto-detected as a Vite project: build command `npm run build`, output directory `dist`. No environment variables or server config needed.

## Stack

Vite, React, TypeScript, Tailwind CSS v4, Dexie (IndexedDB), Motion, vite-plugin-pwa (Workbox service worker), self-hosted Outfit font.

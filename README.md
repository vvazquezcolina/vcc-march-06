# Festival Builder

> A four-step interactive tool that lets anyone design an imaginary music festival: curate a lineup, sculpt a 3D mainstage in the browser, place the venue on Google Maps, and export a poster. Built with Next.js 15, React Three Fiber and a Zustand store.

**Live:** [vcc-march-06.vercel.app](https://vcc-march-06.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-15-000)
![React](https://img.shields.io/badge/React-19-61dafb)
![Three.js](https://img.shields.io/badge/Three.js-R3F-049ef4)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)

---

## Why this exists

Promoters, clients and creative teams all pitch the same imaginary festival on the same flat decks. This tool turns that pitch into an interactive artifact: you walk through four steps and walk out with a lineup, a 3D mainstage preview, a real venue on a map, and a shareable poster.

It started as a weekend experiment with React Three Fiber and Google Maps, and turned into a reusable creative tool.

## The four steps

1. **Lineup** — build your artist lineup with a form-driven quiz
2. **Stage** — design a 3D mainstage (lights, trusses, screens, layout) in a React Three Fiber scene; dynamically imported so the 3D engine only loads when needed
3. **Venue** — pick a real-world location using Google Maps JS API
4. **Poster** — generate a downloadable flyer combining everything

## Features

- **Client-side 3D** via `@react-three/fiber` + `@react-three/drei`, dynamically imported with a loading state
- **Global state** via `zustand` — one `useFestivalStore` survives every step
- **Animated background** for a cinematic dark-mode feel
- **Google Maps** venue picker with interactive marker placement
- **Poster generator** that composes the final flyer from the user's choices
- **Strict TypeScript** and ESLint flat config (`eslint-config-next`)

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | File-based routing, React 19 support |
| UI | React 19 + Tailwind CSS 4 | Modern defaults, zero-config styling |
| 3D | `@react-three/fiber` + `@react-three/drei` + `three` | Declarative Three.js inside React |
| State | `zustand` | ~1 KB store, no boilerplate |
| Maps | `@googlemaps/js-api-loader` | Official loader, avoids global script tags |
| Hosting | Vercel | Git-based deploys, preview URLs per PR |

## Architecture

```
src/
├── app/
│   ├── api/             # Route handlers (server-side)
│   ├── layout.tsx
│   ├── page.tsx         # Four-step flow
│   └── globals.css
├── components/
│   ├── QuizForm.tsx         # Step 1 — lineup builder
│   ├── StageBuilder.tsx     # Step 2 — R3F scene (dynamic import, ssr:false)
│   ├── VenueFinder.tsx      # Step 3 — Google Maps picker
│   ├── FlyerGenerator.tsx   # Step 4 — poster export
│   └── AnimatedBackground.tsx
├── store/
│   └── festival-store.ts    # Zustand global state
├── lib/                 # Utilities
└── types/               # Shared TS types
```

The `StageBuilder` component is loaded with `dynamic(..., { ssr: false })` so Three.js and its ~600 KB of assets never ship on the initial HTML — users only pay the cost once they reach step 2.

## Running locally

```bash
git clone https://github.com/vvazquezcolina/vcc-march-06.git
cd vcc-march-06
npm install
cp .env.example .env.local   # add your Google Maps key
npm run dev                  # http://localhost:3000
```

### Environment variables

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint 9 + `eslint-config-next` |

## Deployment

Automatic deploys to Vercel on every push. Preview URLs per PR. Environment variables set in the project dashboard.

---

**Author:** [Victor Vazquez](https://github.com/vvazquezcolina) — builder, Cancún MX.

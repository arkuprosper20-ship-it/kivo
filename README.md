# KIVO — Train. Progress. Become.

**AI-Powered Athletic Development System for Kids (ages 5–16)**

> KIVO doesn't just give kids something to play with. It gives them a way to see themselves getting better.

This repository is the **digital brain of the KIVO ecosystem**: a child-first athletic
development platform combining measurable challenges, progression, gamification,
performance analytics, and AI coaching. The 11 physical KIVO products are the future
ecosystem — this hackathon build is the intelligence layer that powers them.

## Problem

Kids' fitness products are either passive toys with no measurement, or adult fitness
apps that rank children against each other. Parents can't see real development, and
kids get no feedback loop that makes practice addictive.

## Solution

KIVO turns activity into **measurable, personal progression** across four outcomes:

| Outcome | Meaning |
|---------|---------|
| **STRONGER** 💪 | Grip, power, body control |
| **FITTER** 🌀 | Stamina, endurance, coordination |
| **FASTER** ⚡ | Speed, agility, reaction |
| **CHAMPS** 🎯 | Challenges, progression, measurable goals |

Flow: **Parent → Child Profile → Assessment → Challenge → Results → AI Coaching → Progress.**

Scoring emphasizes **personal improvement only** — children compete against their own
yesterday, never against each other.

## Features

- 🏠 Premium splash + one-click **Demo Mode** (Aarav, 10, fully pre-populated)
- 👪 Mock auth (parent/child/coach roles) + child profiles
- 📋 Interactive 4-test baseline **assessment** with animated results
- 🌀 **Rope Rush** — tap jump counter, 20/30/60s rounds, consistency tracking, pause
- ⚡ **Reaction Rush** — 4 glowing pods, reaction ms + accuracy, keyboard support
- 🎯 **Agility Command** — growing station sequences, time + errors
- 🎉 Animated **results screen**: count-up score, PB banner, XP, next steps
- 🧮 Centralized **scoring engine** (normalize → improvement → PB → XP → outcomes)
- 🏅 Levels, XP, 7 badges, streaks, full-screen LEVEL UP celebrations
- 🤖 **AI Coach**: encouragement, strongest/weakest area, next challenge, difficulty, workout plan
- 📋 Adaptive **Today's Plan** generator (weakest-area focused)
- 📈 Progress analytics (Recharts), challenge history with filters, personal records
- 👪 Parent dashboard with plain-language weekly insight (never medical)
- 📱 Mobile-first responsive, keyboard nav, reduced-motion support, loading/error/retry states

## How It Works

```
Child performance
  → frontend games capture raw metrics
  → POST /api/challenges/:id/complete
  → scoring engine (normalize, improvement vs own best, PB, XP)
  → gamification (badges, streak, level) + outcome-score update
  → AI prompt builder (scores + history + streak)
  → LLM (OpenAI-compatible) or deterministic fallback
  → validated CoachResponse → app UI
```

## Tech Stack

- **Frontend:** React 18, Vite 5, TypeScript, Tailwind CSS, React Router 6, Framer Motion, Lucide, Recharts
- **Backend:** Node.js, Express 4, TypeScript, Vitest
- **Database:** Supabase PostgreSQL (optional — seeded in-memory store is default)
- **AI:** OpenAI-compatible chat API with deterministic fallback (`backend/src/services/ai/`)

## Installation

```bash
# prerequisites: Node 18+
npm run setup        # installs backend + frontend + root deps
```

Configure (optional — everything works with zero config):

```bash
cp .env.example backend/.env   # then set OPENAI_API_KEY / SUPABASE_* if you have them
# frontend reads VITE_API_URL (default http://localhost:5000/api)
```

## Running Locally

```bash
npm run dev          # backend :5000 + frontend :5173 together
# or separately:
npm run dev:backend
npm run dev:frontend
```

Open http://localhost:5173 → **Continue as Demo** → play Reaction Rush → Results →
AI Coach → Progress → Achievements. The full judge story takes ~4 minutes.

```bash
npm run build        # typechecks + builds backend and frontend
npm test             # backend scoring tests (13 tests)
```

Demo login (manual): `demo@kivo.app` / `demo1234`.

## AI Usage

`POST /api/ai/coach` and `POST /api/ai/workout` return validated structured JSON:

```json
{
  "encouragement": "...", "strongestArea": "faster", "weakestArea": "champs",
  "recommendation": "...", "nextChallenge": "agility-command",
  "difficulty": "Level 3 — push the pace", "workout": [...]
}
```

Set `OPENAI_API_KEY` (and optionally `OPENAI_BASE_URL` / `OPENAI_MODEL`) for live LLM
output; otherwise a realistic deterministic provider responds. Prompts and the
response validator both enforce **coaching-only language — no medical claims, ever**.

## Hardware

No hardware required. `hardware/react-pod/` contains an ESP32 sketch (4 LED + button
pods over Wi-Fi) and the planned `POST /api/hardware/tap` ingest design — hardware is
just another input to the same scoring engine.

## Screenshots

> TODO: add screenshots (`docs/screenshots/`) — dashboard, reaction game, results, coach.

## Demo Video

> TODO: add 3–5 min demo video link (splash → demo → reaction game → results → coach → progress → badges).

## Team

KIVO hackathon team — digital intelligence system track.

## Future Scope

- Supabase Auth + RLS for real parent/child accounts
- More challenges (hang test, shuttle run, balance) + ESP32 pod pairing
- School/coach multi-athlete views, seasonal programs
- Wearable integration, offline-first PWA, i18n

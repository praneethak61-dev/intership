# Cold-Call Copilot

Real-time call guidance screen for Meridian Growth Partners callers. Built from 100 real cold-call transcripts.

## Live URLs

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | _add after deployment_ |
| **Backend health (Render)** | _add after deployment_`/health` |

## LLM Used

**Google Gemini 3.8 Flash** via Google AI Studio (free tier). Override with `GEMINI_MODEL` in `backend/.env` if needed.

**What it does:** After a caller types the prospect's words into the "Their Words" box, the app waits 1.2 seconds and sends the text to the backend, which asks Gemini which stage the call is likely in now. The suggestion appears as a subtle hint below the text box. The caller can accept or ignore it.

The key is held on the backend only — never in the browser.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Vite, plain CSS, React Router |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini 3.8 Flash |
| Frontend hosting | Vercel |
| Backend hosting | Render |

## Setup

### 1. Supabase schema

Run `supabase/schema.sql` in your Supabase project's SQL Editor.

### 2. Backend

```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY in .env
npm install
npm start
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:3001 (local) or your Render URL (production)
npm install
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/calls/start` | Start a new call |
| POST | `/calls/:id/stage` | Save a stage result |
| POST | `/calls/:id/close` | Close call with outcome |
| GET | `/calls` | List all calls |
| GET | `/calls/:id` | Get one call with stages |
| POST | `/ai/suggest-stage` | Gemini stage suggestion |
| POST | `/ai/summarise-call` | Gemini call summary |

## Deploying to Vercel + Render

### Backend → Render

1. Push the repo to GitHub
2. New Web Service on Render, root directory: `backend`
3. Build: `npm install`, Start: `node server.js`
4. Add environment variables: `SUPABASE_URL`, `SUPABASE_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `FRONTEND_URL`

### Frontend → Vercel

1. New project on Vercel, root directory: `frontend`
2. Framework: Vite
3. Add environment variable: `VITE_API_URL=https://<your-render-url>`

## Transcripts

100 real cold-call transcripts (all company and person names fictional) in `cold-call-transcripts-100/`. These were the source for every quote and button label on the stage screen.

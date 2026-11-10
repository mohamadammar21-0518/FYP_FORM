# AIU FYP Student Attendance Form

A simple web form for AIU students to submit their FYP course attendance data. Built with React + Express + tRPC + PostgreSQL.

## Local Development

1. Copy `.env.example` to `.env` and fill in your `DATABASE_URL`
2. Run `pnpm install`
3. Run `pnpm db:migrate` to apply the database schema
4. Run `pnpm dev` to start the dev server on port 3000

## Deploy to Render (Recommended)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your GitHub repo — Render reads `render.yaml` and auto-creates:
   - A **web service** (Node.js)
   - A **PostgreSQL database** (free tier)
4. Click **Apply** — it will build and deploy automatically
5. After deploy, run the DB migration once from the Render shell:
   ```
   pnpm db:migrate
   ```

## Deploy to Vercel + Neon (Alternative)

1. Create a free PostgreSQL database at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Push repo to GitHub, connect to [vercel.com](https://vercel.com)
4. Add environment variable: `DATABASE_URL = <your neon connection string>`
5. Set build command: `pnpm build`
6. Set output directory: `dist/public`
7. Run `pnpm db:migrate` locally pointing at the Neon DB to set up the schema

## Scripts

- `pnpm dev` — development server (port 3000)
- `pnpm build` — production build
- `pnpm start` — start production server
- `pnpm db:migrate` — apply schema migrations to the database
- `pnpm db:push` — generate + apply new schema changes

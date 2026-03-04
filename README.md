# The Quiz House

The ultimate quiz platform — challenge yourself, compete on leaderboards, and prove you're the sharpest mind in the room.

## Features

- **Quiz Catalog** — Browse and play published quizzes
- **Gameplay Engine** — Timed questions with server-side scoring
- **Leaderboards** — Per-quiz rankings (best score, fastest time)
- **PayFast Payments** — B2C purchases and corporate packages
- **Corporate Codes** — Bulk purchase redeem codes with CSV download
- **AI Content Builder** — Generate quiz drafts with OpenAI
- **AI QA Agent** — Automated quality checks on quiz content
- **Quiz House Recap** — AI-generated results summary with SA flair
- **Role-based Access** — Player and Admin roles with RLS

## Tech Stack

- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Payments**: PayFast (ITN webhook)
- **AI**: OpenAI GPT-4o

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd quizmaster
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migrations in `supabase/migrations/` via the SQL Editor
3. Copy your project URL and keys

### 3. Configure environment

```bash
cp .env.example .env.local
# Fill in your Supabase, OpenAI, and PayFast credentials
```

### 4. Seed the database

```bash
npm run seed
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Create an admin user

1. Sign up through the app
2. Run this SQL in Supabase:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Project Structure

```
quizmaster/
├── src/
│   ├── app/
│   │   ├── admin/           # Admin quiz CRUD + AI tools
│   │   ├── api/             # API routes (attempts, orders, webhooks, AI)
│   │   ├── auth/            # Login, signup, callback
│   │   ├── dashboard/       # User dashboard, orders, codes, redeem
│   │   ├── leaderboard/     # Per-quiz leaderboard
│   │   └── quiz/            # Catalog, detail, play, results
│   ├── components/          # Shared React components
│   ├── lib/
│   │   ├── supabase/        # Client, server, admin, middleware
│   │   ├── ai.ts            # OpenAI integration
│   │   └── payfast.ts       # PayFast signature + verification
│   └── types/               # TypeScript type definitions
├── supabase/
│   └── migrations/          # SQL schema + RLS policies
├── scripts/
│   └── seed.ts              # Database seeder
└── .env.example
```

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `OPENAI_API_KEY` | OpenAI API key |
| `PAYFAST_MERCHANT_ID` | PayFast merchant ID |
| `PAYFAST_MERCHANT_KEY` | PayFast merchant key |
| `PAYFAST_PASSPHRASE` | PayFast passphrase (if configured) |
| `PAYFAST_SANDBOX` | `true` for sandbox, `false` for live |
| `PAYFAST_RETURN_URL` | URL after successful payment |
| `PAYFAST_CANCEL_URL` | URL after cancelled payment |
| `PAYFAST_ITN_URL` | PayFast ITN webhook URL |

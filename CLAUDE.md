# CLAUDE.md - AI Assistant Guidelines for Roundtable PA

This document provides guidance for AI assistants working on the Roundtable PA civic engagement platform.

## Project Overview

**Roundtable PA** is an anonymous, nonbiased real-time political social media platform focused on Pennsylvania. The platform automatically ingests news from PA sources, uses ML to filter and summarize articles, and allows users to engage through voting and commenting.

### Core Concepts

- **Anonymity**: Users identified by aliases like "5 yr PA resident", not names
- **Vote-first engagement**: Must vote before commenting on articles
- **AI-summarized content**: Articles auto-generated with title, who should care, summary, impact
- **Real-time feed**: Auto-updating with new articles from PA news sources
- **Nonpartisan design**: UI uses neutral colors, avoids party associations

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Prisma** with SQLite for database
- **Supabase** for authentication (magic links) and real-time subscriptions
- **Transformers.js** for on-device ML (summarization, classification)
- **RSS Parser + Cheerio** for news ingestion
- **Zod** for validation

## Project Structure

```
roundtable/
├── prisma/
│   ├── schema.prisma        # Database models
│   └── seed.ts              # Feed sources + sample articles
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── articles/    # Article CRUD, voting, comments
│   │   │   ├── profile/     # User alias management
│   │   │   └── user/        # User profile lookup
│   │   ├── auth/
│   │   │   ├── signin/      # Magic link sign in
│   │   │   └── callback/    # Auth callback handler
│   │   ├── profile/         # Profile setup page
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Main feed with real-time
│   │   ├── globals.css      # Tailwind + custom styles
│   │   └── providers.tsx    # Auth context provider
│   ├── components/
│   │   ├── Header.tsx       # Navigation with auth state
│   │   ├── ArticleCard.tsx  # Article display with voting
│   │   ├── VoteButtons.tsx  # Approve/Neutral/Disapprove
│   │   └── CommentSection.tsx
│   ├── lib/
│   │   ├── db.ts            # Prisma client singleton
│   │   ├── supabase/        # Supabase client utilities
│   │   │   ├── client.ts    # Browser client
│   │   │   ├── server.ts    # Server client
│   │   │   └── middleware.ts
│   │   └── ml/
│   │       ├── summarizer.ts # ML summarization + scoring
│   │       └── fetcher.ts    # RSS feed fetching
│   ├── jobs/
│   │   └── ingest.ts        # Background ingestion job
│   └── types/
│       └── index.ts         # Type definitions
├── middleware.ts            # Supabase session handling
└── ...config files
```

## Key Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed feed sources + sample articles
npm run db:studio    # Open Prisma Studio

# Article Ingestion
npm run ingest       # Run single ingestion cycle
npm run ingest:watch # Continuous ingestion (every 5 min)
```

## Database Schema

### Models

- **User**: Supabase auth ID + alias (aliasType, aliasYears)
- **FeedSource**: RSS feed URLs for PA news sources
- **RawArticle**: Unprocessed articles from RSS feeds
- **Article**: ML-summarized articles shown to users
- **Vote**: APPROVE/DISAPPROVE/NEUTRAL per user per article
- **Comment**: Text content, linked to user vote

### Processing Pipeline

```
FeedSource → RawArticle → (ML scoring) → (ML summarization) → Article
    RSS         PENDING      APPROVED        SUMMARIZED
                REJECTED
                ERROR
```

## ML Pipeline

### Relevance Scoring (`src/lib/ml/summarizer.ts`)

Uses keyword matching to score PA relevance (0-1):
- PA keywords: philadelphia, pittsburgh, harrisburg, septa, etc.
- Political keywords: election, legislation, budget, etc.
- Threshold: 0.3 minimum to process

### Summarization

Uses Transformers.js with `Xenova/distilbart-cnn-6-6`:
- Generates concise summary (30-80 tokens)
- Extracts "who should care" audience
- Generates impact statement
- Detects region and category

### Feed Sources

Pre-configured PA news sources:
- Philadelphia Inquirer
- Pittsburgh Post-Gazette
- PennLive
- WHYY
- WESA Pittsburgh
- Spotlight PA

## Authentication (Supabase)

### Flow
1. User enters email on `/auth/signin`
2. Supabase sends magic link email
3. User clicks link → `/auth/callback`
4. Callback creates/updates user in Prisma DB
5. Session stored in cookies

### Context
`useAuth()` hook provides:
- `user`: Supabase user object
- `profile`: User profile with alias
- `isLoading`: Auth state loading
- `signOut()`: Sign out function
- `refreshProfile()`: Reload profile data

## Real-time Updates

Main feed subscribes to Supabase real-time:
```typescript
supabase
  .channel("articles")
  .on("postgres_changes", { event: "INSERT", table: "Article" }, ...)
  .subscribe();
```

## API Routes

### GET /api/articles
Returns articles with vote stats and user's vote status

### POST /api/articles/[id]/vote
Body: `{ voteType: "APPROVE" | "DISAPPROVE" | "NEUTRAL" }`

### GET/POST /api/articles/[id]/comments
GET: Returns comments with aliases
POST: `{ content: string }` (requires prior vote)

### PATCH /api/profile
Body: `{ aliasType: AliasType, aliasYears?: number }`

### GET /api/user/[id]
Returns user profile for auth context

## Environment Variables

```bash
# Database
DATABASE_URL="file:./dev.db"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxx"
SUPABASE_SERVICE_ROLE_KEY="xxx"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Development Guidelines

### Adding New Feed Sources

1. Add to `PA_NEWS_FEEDS` in `src/lib/ml/fetcher.ts`
2. Run `npm run db:seed` to add to database
3. Or add directly via Prisma Studio

### Improving ML Accuracy

- Adjust `PA_KEYWORDS` and `POLITICAL_KEYWORDS` in `summarizer.ts`
- Modify `RELEVANCE_THRESHOLD` (default: 0.3)
- Update category detection logic

### Security Considerations

- All API routes verify Supabase session
- Vote-before-comment enforced server-side
- User emails never exposed in responses
- Input validated with Zod schemas

## Code Style

- Variables/functions: `camelCase`
- Components/classes: `PascalCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Files: Match export name

## Git Workflow

- Feature branches: `feature/<description>`
- Bug fixes: `fix/<description>`
- Claude sessions: `claude/<session-id>`

---

*Update this document as the project evolves.*

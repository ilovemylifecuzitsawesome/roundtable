# Roundtable PA

Anonymous, nonbiased real-time political social media for Pennsylvania.

## Overview

Roundtable PA is a civic engagement platform designed to facilitate meaningful political discourse without the polarization that comes from identity-based discussions. Users participate anonymously using experience-based aliases (e.g., "5 yr PA resident", "3 yr educator") rather than names or handles.

### Key Features

- **Magic Link Authentication** - No passwords, just email verification
- **Anonymous Aliases** - Identified by experience, not identity
- **Summarized News** - Each article includes:
  - Title
  - Who should care
  - Summary (2-3 sentences)
  - Impact statement
- **Vote-First Engagement** - Users must vote (Approve/Disapprove/Neutral) before commenting
- **Transparent Sentiment** - Vote percentages shown after voting
- **PA-Focused** - Initial MVP focused on Pennsylvania politics

## Getting Started

### Prerequisites

- Node.js 18+
- npm/pnpm/yarn

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed sample articles
npm run db:seed

# Start development server
npm run dev
```

### Environment Setup

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required variables:
- `DATABASE_URL` - SQLite database path
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- Email configuration for magic links

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Auth**: NextAuth.js with Magic Links

## Project Structure

```
roundtable/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Sample data seeder
├── src/
│   ├── app/             # Next.js App Router
│   │   ├── api/         # API routes
│   │   ├── auth/        # Auth pages
│   │   └── profile/     # User profile
│   ├── components/      # React components
│   ├── lib/             # Utilities (db, auth)
│   └── types/           # TypeScript types
└── ...config files
```

## License

MIT

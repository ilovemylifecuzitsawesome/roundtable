# CLAUDE.md - AI Assistant Guidelines for Roundtable PA

This document provides guidance for AI assistants working on the Roundtable PA civic engagement platform.

## Project Overview

**Roundtable PA** is an anonymous, nonbiased real-time political social media platform focused on Pennsylvania. Users engage with summarized news through voting and commenting, identified only by experience-based aliases.

### Core Concepts

- **Anonymity**: Users are identified by aliases like "5 yr PA resident", not names
- **Vote-first engagement**: Must vote before commenting on articles
- **Summarized content**: Articles have title, who should care, summary, impact
- **Nonpartisan design**: UI uses neutral colors, avoids party associations

## Tech Stack

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Prisma** with SQLite for database
- **NextAuth.js** for magic link authentication
- **Zod** for validation

## Project Structure

```
roundtable/
├── prisma/
│   ├── schema.prisma        # Database models
│   └── seed.ts              # Sample PA articles
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── articles/    # Article CRUD, voting, comments
│   │   │   ├── auth/        # NextAuth handler
│   │   │   └── profile/     # User alias management
│   │   ├── auth/            # Sign in/verify pages
│   │   ├── profile/         # Profile setup page
│   │   ├── layout.tsx       # Root layout with providers
│   │   ├── page.tsx         # Main feed
│   │   ├── globals.css      # Tailwind + custom styles
│   │   └── providers.tsx    # SessionProvider wrapper
│   ├── components/
│   │   ├── Header.tsx       # Navigation with auth state
│   │   ├── ArticleCard.tsx  # Article display with voting
│   │   ├── VoteButtons.tsx  # Approve/Neutral/Disapprove
│   │   └── CommentSection.tsx # Vote-gated comments
│   ├── lib/
│   │   ├── auth.ts          # NextAuth configuration
│   │   └── db.ts            # Prisma client singleton
│   └── types/
│       └── index.ts         # Type definitions + helpers
```

## Key Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed sample articles
npm run db:studio    # Open Prisma Studio
```

## Database Schema

### Models

- **User**: Auth + alias (aliasType, aliasYears)
- **Article**: Summarized news (title, whoShouldCare, summary, impact)
- **Vote**: APPROVE/DISAPPROVE/NEUTRAL per user per article
- **Comment**: Text content, linked to user vote

### Key Constraints

- One vote per user per article (`@@unique([userId, articleId])`)
- Comments require prior vote (enforced in API)
- Alias shown instead of user identity

## UI/UX Patterns

### Color Palette

- `civic-*`: Neutral slate colors for UI
- `approve`: Muted green (#059669)
- `disapprove`: Muted red (#dc2626)
- `neutral`: Gray (#6b7280)

### Component Classes

```css
.btn-primary    /* Dark civic button */
.btn-secondary  /* Light civic button */
.card           /* White rounded container */
.input          /* Form input styling */
.vote-btn-*     /* Vote button variants */
```

### Article Card Layout

1. Category tag + Region + Time
2. Title (prominent)
3. "Who should care" line
4. Summary paragraph
5. Impact box (highlighted)
6. Source attribution
7. Vote buttons
8. Expandable comments

## API Routes

### GET /api/articles
Returns articles with vote stats and user's vote/comment status

### POST /api/articles/[id]/vote
Body: `{ voteType: "APPROVE" | "DISAPPROVE" | "NEUTRAL" }`
Requires auth, one vote per article

### GET /api/articles/[id]/comments
Returns comments with user aliases and vote badges

### POST /api/articles/[id]/comments
Body: `{ content: string }`
Requires auth + prior vote on article

### PATCH /api/profile
Body: `{ aliasType: AliasType, aliasYears?: number }`
Updates user's anonymous alias

## Alias Types

```typescript
enum AliasType {
  PA_RESIDENT       // "X yr PA resident"
  COLLEGE_STUDENT   // "X yr college student"
  POLI_SCI_WORKER   // "X yr poli sci worker"
  GOVT_WORKER       // "X yr govt worker"
  JOURNALIST        // "X yr journalist"
  EDUCATOR          // "X yr educator"
  HEALTHCARE        // "X yr healthcare worker"
  OTHER             // "community member"
}
```

## Development Guidelines

### Adding New Features

1. Update Prisma schema if needed (`prisma/schema.prisma`)
2. Run `npm run db:generate` and `npm run db:push`
3. Add types to `src/types/index.ts`
4. Create API routes in `src/app/api/`
5. Build components in `src/components/`
6. Use existing Tailwind classes and patterns

### Security Considerations

- All API routes check session authentication
- Vote-before-comment enforced server-side
- User emails never exposed in responses
- Input validated with Zod schemas
- Aliases are experience-based, not identifying

### Civic Design Principles

1. **Accessibility**: Ensure features work for all users
2. **Neutrality**: Avoid colors/language suggesting political bias
3. **Privacy**: Only show aliases, never emails/names
4. **Transparency**: Show vote distributions after voting
5. **Engagement**: Low barrier to participate (magic links)

## Code Style Conventions

1. **Naming Conventions**
   - Variables and functions: `camelCase`
   - Components and classes: `PascalCase`
   - Constants: `SCREAMING_SNAKE_CASE`
   - Files: Match the export name (e.g., `ArticleCard.tsx`)

2. **Code Organization**
   - Keep files focused and single-purpose
   - Prefer composition over inheritance
   - Extract reusable logic into utility functions

3. **Comments**
   - Write self-documenting code where possible
   - Add comments for complex business logic

## Git Workflow

1. **Branch Naming**
   - Feature branches: `feature/<description>`
   - Bug fixes: `fix/<description>`
   - Claude sessions: `claude/<session-id>`

2. **Commit Messages**
   - Use present tense: "Add feature" not "Added feature"
   - Be concise but descriptive

## Future Considerations

- Real-time updates with SSE or WebSockets
- Admin panel for article management
- Content moderation system
- Expanded regions beyond PA
- Mobile app version

---

*Update this document as the project evolves.*

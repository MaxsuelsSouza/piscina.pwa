# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lista de Casa Nova** - Sistema de lista de presentes e gerenciamento de convidados para eventos, PWA com Next.js 14, Firebase, e integracao com Mercado Pago para pagamentos PIX.

## Tech Stack

- **Framework**: Next.js 14.2 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Custom Auth via phone + password (stored in Firestore `clients` collection)
- **Payments**: Mercado Pago (PIX) for gift payments
- **State Management**: React Context + React Hook Form
- **PWA**: @ducanh2912/next-pwa (enabled in production only)
- **Component Docs**: Storybook 8 + Chromatic

## Essential Commands

```bash
# Development
pnpm run dev              # Start dev server (localhost:3000)
pnpm run type-check       # TypeScript type checking (no build)
pnpm run lint             # ESLint

# Production
pnpm run build            # Production build
pnpm start                # Start production server

# Storybook
pnpm run storybook        # Dev server (port 6006)
pnpm run build-storybook  # Build static Storybook

# Cleanup
pnpm run clean            # Remove .next, out, .turbo, storybook-static
pnpm run fresh            # Clean + restart dev
pnpm run clean:reinstall  # Nuclear: delete node_modules + reinstall
```

## Architecture

### Authentication Model

**Single authentication layer - Phone + Password:**

1. **Admin** (phone-based)
   - Hardcoded phone in `src/config/admin.ts`
   - Full access to workspace and all modules
   - Can manage guests and gifts

2. **Guests** (phone-based)
   - Regular users who can view/select gifts
   - Stored in `clients` collection (phone as document ID)
   - Can confirm presence and select gifts

### Route Structure

```
src/app/
├── page.tsx                    # Root redirect (→ /login, /workspace, or /presentes)
├── login/page.tsx              # Login page (phone + password)
├── workspace/                  # Admin workspace (modules hub)
│   ├── page.tsx                # Module selection
│   └── usuarios/page.tsx       # Redirects to /presentes/convidados
├── presentes/                  # Gifts module
│   ├── page.tsx                # Main menu
│   ├── categorias/             # Gift categories
│   │   ├── page.tsx            # Category list
│   │   └── [category]/page.tsx # Category detail
│   ├── meus/page.tsx           # My selected gifts
│   ├── confirmar/page.tsx      # Confirm presence
│   ├── admin/page.tsx          # Admin panel (guest stats)
│   ├── convidados/page.tsx     # Guest management
│   └── gerenciar/page.tsx      # Gift management
├── treino/                     # Training module
│   ├── page.tsx                # Training list
│   ├── [id]/page.tsx           # Training detail
│   └── _types/index.ts         # Training types
├── admin/                      # Legacy (only seed-gifts remains)
│   └── seed-gifts/page.tsx     # Seed gifts utility
└── api/
    ├── admin/
    │   ├── users/              # User CRUD (Firebase Admin SDK)
    │   └── gifts/seed/         # Seed gifts API
    ├── treino/                 # Training CRUD API
    └── public/
        ├── gifts/              # Gift APIs (includes PIX payments)
        ├── guests/             # Guest management API
        └── presence/           # Presence confirmation API
```

### Data Model

**Firestore Collections:**

1. **`clients`** - Users (guests and admin)
   ```typescript
   {
     phone: string,            // Document ID (only digits)
     fullName: string,
     passwordHash: string,     // bcrypt hashed password
     presenceStatus?: 'pending' | 'confirmed' | 'declined',
     companions?: number,
     companionNames?: string[],
     createdAt: string,
     updatedAt: string
   }
   ```

2. **`gifts`** - Gift items
   ```typescript
   {
     id: string,
     name: string,
     category: GiftCategory,
     link?: string,
     isSelected: boolean,
     selectedBy?: string[],    // Array of phone numbers
     forceUnavailable?: boolean,
     createdAt: string,
     updatedAt: string
   }
   ```

3. **`treinos`** - Training programs
   ```typescript
   {
     id: string,
     nome: string,
     descricao?: string,
     pessoa: 'Maxsuel' | 'Juliana',
     status: 'ativo' | 'inativo',
     dias: DiaTreino[],
     createdAt: string,
     updatedAt: string
   }
   ```

### Gift Categories

```typescript
type GiftCategory =
  | 'cozinha-eletrodomesticos'
  | 'cozinha-utensilios'
  | 'cozinha-servir'
  | 'area-servico-maquinario'
  | 'quarto-enxoval';
```

## Key Files

| File | Purpose |
|------|---------|
| `src/config/admin.ts` | Admin phone number and isAdmin() function |
| `src/contexts/ClientAuthContext.tsx` | Phone-based authentication context |
| `src/hooks/useGifts.ts` | Gift fetching and selection hook |
| `src/types/gift.ts` | Gift types and category labels |
| `src/lib/firebase/firestore/gifts.ts` | Gift Firestore operations |

## Path Aliases

```typescript
@/*           → ./src/*
@/components/* → ./src/components/*
@/lib/*        → ./src/lib/*
@/hooks/*      → ./src/hooks/*
@/types/*      → ./src/types/*
@/config/*     → ./src/config/*
@/contexts/*   → ./src/contexts/*
```

## Authentication Flow

1. User enters phone number at `/login`
2. System checks if phone exists in `clients` collection
3. If exists with password → login form
4. If exists without password → create password form (for guests added by admin)
5. If not exists → register form
6. On success:
   - Admin → redirect to `/workspace`
   - Guest → redirect to `/presentes`

## Common Tasks

### Adding a new guest (admin)

1. Go to `/presentes/convidados`
2. Click "+" button
3. Enter guest name and phone
4. Guest will create password on first login

### Selecting a gift (guest)

1. Go to `/presentes/categorias`
2. Select a category
3. Click "Escolher" on available gift
4. View selected gifts at `/presentes/meus`

### Managing gifts (admin)

1. Go to `/presentes/gerenciar`
2. Add new gifts with name, category, and optional link
3. Edit or delete existing gifts
4. Toggle availability

## Environment Variables

```bash
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... (other NEXT_PUBLIC_FIREBASE_* vars)

# Firebase Admin SDK (server-only)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Mercado Pago (for PIX payments)
MERCADO_PAGO_ACCESS_TOKEN=...

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Testing & Quality

```bash
pnpm run type-check      # Must pass before committing
pnpm run lint            # Fix linting issues
pnpm run storybook       # Visual testing for components
```

## Security

- Passwords hashed with bcrypt
- Input sanitization: `src/lib/security/input-sanitizer.ts`
- Rate limiting: `src/lib/security/rate-limiter.ts`
- CSP headers in middleware
- Firestore Rules for data access control

## Known Limitations

- No email sending (password resets manual via admin)
- No SMS notifications
- No file uploads (gift images not implemented)
- Single admin (phone-based, not role-based)
- No i18n (Portuguese only)

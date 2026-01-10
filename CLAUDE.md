# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Agendamentos Muca** - Sistema de agendamento de piscinas/espaços para eventos com gestão financeira, PWA com Next.js 14, Firebase, e integração com Mercado Pago para pagamentos PIX.

## Tech Stack

- **Framework**: Next.js 14.2 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Firebase Firestore (NoSQL)
- **Authentication**: Firebase Auth (admin/client) + Custom Auth (public clients via phone/birthdate)
- **Payments**: Mercado Pago (PIX)
- **State Management**: Zustand + React Hook Form
- **PWA**: @ducanh2912/next-pwa (enabled in production only)
- **Component Docs**: Storybook 8 + Chromatic

## Essential Commands

```bash
# Development
pnpm run dev              # Start dev server (localhost:3000)
pnpm run type-check       # TypeScript type checking (no build)
pnpm run lint             # ESLint

p# Production
pnpm run build            # Production build
pnpm start                # Start production server

p# Storybook
pnpm run storybook        # Dev server (port 6006)
pnpm run build-storybook  # Build static Storybook

p# Cleanup
pnpm run clean            # Remove .next, out, .turbo, storybook-static
pnpm run fresh            # Clean + restart dev
pnpm run clean:reinstall  # Nuclear: delete node_modules + reinstall
```

## Architecture

### Multi-Tenant System

The app supports **multiple clients** (e.g., venue owners like "Muca Fest", "Max Fest"), each with:
- Unique public slug for booking pages (`/agendamento/[slug]`)
- Their own bookings, blocked dates, and financial data
- Profile completeness tracking (80%+ shows booking link)
- Subscription management with due dates

### Authentication Model

**Three authentication layers:**

1. **Admin Users** (Firebase Auth)
   - Hardcoded UID in `src/config/admin.ts` and `firestore.rules`
   - Full access to all data and admin panel
   - Can create/manage client users

2. **Client Users** (Firebase Auth)
   - Venue owners who manage their space (e.g., pool rentals)
   - Role: `'client'` in `users` collection
   - Access to their own dashboard at `/admin` (client view)
   - Access to super admin panel at `/admin/painel` (if admin)
   - Multi-tenant: filtered by `ownerId` in Firestore queries

3. **Public Clients** (Custom Auth - Phone + Birthdate)
   - Customers who book venues via public pages
   - No Firebase Auth - uses phone + birthdate validation
   - Stored in `clients` collection (phone as document ID)
   - Can view their bookings at `/perfil-cliente`

### Route Groups & Structure

```
src/app/
├── (auth)/                    # Auth pages (login, register, forgot-password)
│   └── login/
│       ├── _hooks/            # useAuth.ts
│       ├── _services/         # authService.ts
│       ├── _types/            # Login types
│       └── _utils/            # validation.ts
│
├── (home)/                    # Client dashboard (authenticated clients)
│   ├── _components/           # BookingCalendar, BookingsList, etc.
│   ├── _hooks/                # useBookings, useMonthlyData, useTransactions
│   ├── _services/             # transactions.service.ts
│   ├── _types/                # booking.ts, index.ts
│   └── _utils/                # calculations.ts, formatters.ts
│
├── admin/                     # Admin panel
│   ├── _components/           # AdminStats, PendingBookings, etc.
│   ├── _hooks/                # useAdminData.ts
│   ├── page.tsx               # Client dashboard (multi-tenant view)
│   ├── painel/page.tsx        # Super admin panel
│   └── usuarios/              # User management (admin only)
│
├── agendamento/[slug]/        # Public booking pages (no auth required)
│   ├── _components/           # CalendarNavigation, PublicBookingHeader
│   ├── _hooks/                # usePublicBooking.ts
│   └── _services/             # booking.service.ts, client.service.ts
│
├── explorar/                  # Discover/explore venues (public)
│   ├── _components/           # VenueCard, VenueMap
│   └── _hooks/                # useVenues.ts
│
├── perfil/                    # Client profile editor (authenticated clients)
│   ├── _components/           # ProfileForm, ProfileCompleteness
│   └── _hooks/                # useProfileForm.ts
│
├── perfil-cliente/page.tsx    # Public client bookings (phone + birthdate auth)
├── login-cliente/page.tsx     # Public client login
│
└── api/
    ├── admin/users/           # User CRUD (admin only, uses Firebase Admin SDK)
    ├── client/bookings/       # Client-specific bookings API
    ├── payments/              # PIX payment creation/status check
    ├── public/                # Public APIs (venues, booking creation)
    └── webhooks/mercadopago/  # Payment status webhooks
```

**Pattern**: Route groups use underscored folders (`_components`, `_hooks`, `_services`, `_types`, `_utils`) for co-located feature code. This keeps related logic together while preventing route pollution.

### Data Model

**Firestore Collections:**

1. **`users`** - Client/Admin users (Firebase Auth)
   ```typescript
   {
     uid: string,              // Firebase Auth UID
     email: string,
     displayName?: string,     // Person's name
     businessName?: string,    // Venue name (e.g., "Muca Fest")
     role: 'admin' | 'client',
     isActive: boolean,
     publicSlug?: string,      // Unique slug for /agendamento/[slug]
     linkRevealed?: boolean,   // True when profile >= 80% complete
     subscriptionDueDate?: Date,
     mustChangePassword?: boolean,
     location?: VenueLocation, // Address, coordinates
     venueInfo?: VenueInfo     // Amenities, capacity, pricing, banking
   }
   ```

2. **`bookings`** - Venue bookings
   ```typescript
   {
     id: string,
     ownerId?: string,         // Client UID who owns this venue
     clientSlug?: string,      // Client's public slug
     date: 'YYYY-MM-DD',
     timeSlot: 'morning' | 'afternoon' | 'evening' | 'full-day',
     customerName: string,
     customerPhone: string,
     customerEmail?: string,
     numberOfPeople: number,
     status: 'pending' | 'confirmed' | 'cancelled',
     payment?: PaymentInfo,    // PIX payment details
     expiresAt?: string,       // Auto-cancel if not confirmed
     notes?: string
   }
   ```

3. **`blockedDates`** - Unavailable dates
   ```typescript
   {
     id: string,
     ownerId?: string,         // Client UID
     date: 'YYYY-MM-DD'
   }
   ```

4. **`clients`** - Public customers (phone + birthdate auth)
   ```typescript
   {
     phone: string,            // Document ID (only digits)
     fullName: string,
     birthDate: 'YYYY-MM-DD',
     createdAt: string,
     updatedAt: string
   }
   ```

### Firestore Security Rules

- **Admin**: Hardcoded UID (`X7aWBsKSpkTQr25mAigi9DkGULG3`), full access
- **Client users**: Only access data where `ownerId == auth.uid`
- **Public clients**: Can create bookings, read bookings with `ownerId` (for public pages)
- **Unauthenticated**: Limited read access for public booking pages

See `firestore.rules` for complete rules.

### Middleware & Route Protection

**Server-Side** (`src/middleware.ts`):
- Adds security headers (CSP, X-Frame-Options, etc.)
- **Does NOT validate auth** (Firebase uses localStorage, not HTTP cookies)
- Actual protection happens via:
  - Client-side: `ProtectedRoute` component
  - Server-side: Firestore Rules + Firebase Admin SDK in API routes

**Client-Side** (`src/components/ProtectedRoute.tsx`):
- Redirects unauthenticated users to `/login`
- Role-based access (admin vs client)

## Key Integrations

### Firebase Admin SDK

Used in API routes for server-side operations (user creation, password resets, etc.):

```typescript
// src/lib/firebase/admin.ts
// Initialized with FIREBASE_SERVICE_ACCOUNT env var (JSON)
```

**IMPORTANT**: Admin SDK requires service account credentials. Set `FIREBASE_SERVICE_ACCOUNT` in `.env.local` with the complete JSON from Firebase Console.

### Mercado Pago (PIX Payments)

```typescript
// src/lib/mercadopago/payment.service.ts
createPixPayment()      // Create PIX payment
getPayment()            // Fetch payment details
checkPaymentStatus()    // Poll for payment confirmation
```

**Webhook**: `/api/webhooks/mercadopago` receives payment notifications from Mercado Pago. Updates booking payment status automatically.

**Env vars**:
- `MERCADO_PAGO_ACCESS_TOKEN` - Your Mercado Pago access token
- `NEXT_PUBLIC_APP_URL` - Base URL for webhook callbacks (must be public, not localhost)

### PWA Configuration

- Service worker disabled in development
- Enabled in production via `next.config.js`
- Manifest at `public/manifest.json`
- Icons should be in `public/icons/` (72x72 to 512x512)

## Path Aliases

```typescript
@/*           → ./src/*
@/components/* → ./src/components/*
@/features/*   → ./src/features/*
@/lib/*        → ./src/lib/*
@/hooks/*      → ./src/hooks/*
@/types/*      → ./src/types/*
@/config/*     → ./src/config/*
```

## Multi-Tenant Patterns

When working with client-specific data:

1. **Always filter by `ownerId`** in queries:
   ```typescript
   const bookings = query(
     collection(db, 'bookings'),
     where('ownerId', '==', currentUser.uid)
   );
   ```

2. **Public booking pages** use `clientSlug` to identify the venue:
   ```typescript
   // /agendamento/[slug]/page.tsx
   const client = await getClientBySlug(params.slug);
   ```

3. **Admin users bypass filters** (see all data)

## Profile Completeness

Clients must complete their profile to ≥80% before their public booking link is revealed:

```typescript
// src/utils/profileCompleteness.ts
calculateProfileCompleteness(user: AppUser): number
```

**Required fields**: businessName, location (address), venueInfo (description, amenities, etc.)

**UI Component**: `ProfileIncompleteModal` prompts users to complete profile.

## Common Pitfalls

1. **Firebase Auth persistence**: Uses `browserLocalPersistence`. Sessions expire after 24 hours (custom logic in `AuthContext.tsx`).

2. **Firestore Timestamps**: Convert Firestore timestamps to JS Dates:
   ```typescript
   // See userDocumentToAppUser() in src/types/user.ts
   ```

3. **Public booking pages**: Must work without authentication. Always check `isAuthenticated()` before showing restricted UI.

4. **Admin UID hardcoded**: Change in both `src/config/admin.ts` and `firestore.rules` if needed.

5. **Mercado Pago webhooks**: Only work in production (not localhost). Use ngrok or deploy to test.

6. **Multi-tenant isolation**: Never forget `ownerId` filters. Missing this leaks data between clients.

## Utility Scripts

```bash
node scripts/create-admin-user.js          # Create initial admin user
node scripts/check-and-fix-slugs.js        # Audit/fix user slugs
node scripts/update-slugs-to-businessname.js  # Regenerate slugs from businessName
```

## Environment Variables

See `.env.local.example` for complete list. Critical ones:

```bash
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
# ... (other NEXT_PUBLIC_FIREBASE_* vars)

# Firebase Admin SDK (server-only)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=...

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## TypeScript Patterns

- Strict mode enabled
- Use Zod schemas for validation (`src/features/auth/schemas/`)
- Export types from feature `index.ts` files (barrel exports)
- Document types in `src/types/` (user.ts, client.ts, etc.)

## Testing & Quality

```bash
npm run type-check      # Must pass before committing
npm run lint            # Fix linting issues
npm run storybook       # Visual testing for components
```

No unit tests configured yet. Component documentation via Storybook.

## Common Tasks

### Adding a new client

1. Admin logs in → `/admin/usuarios`
2. Click "Criar Novo Usuário"
3. Fill form (email, password, businessName, etc.)
4. System auto-generates `publicSlug` from businessName
5. Client receives email with temp password (must change on first login)

### Creating a booking (public)

1. Customer visits `/agendamento/[slug]` (e.g., `/agendamento/muca-fest-x7h2`)
2. Selects date + time slot
3. Fills customer info (name, phone, email)
4. System creates booking with `status: 'pending'` and `ownerId` of venue owner
5. If payment required, generates PIX QR code via Mercado Pago
6. Webhook auto-confirms booking when payment received

### Blocking a date

1. Client logs in → `/admin` (home dashboard)
2. Clicks on date in calendar → "Bloquear Dia"
3. System creates `blockedDates` document with `ownerId`
4. Public booking page shows date as unavailable

## Performance Notes

- Firestore queries are real-time via `onSnapshot` (see `useBookings.ts`)
- PWA caches static assets + navigation (production only)
- Lucide icons optimized via `next.config.js`
- Tailwind CSS purges unused styles in production

## Known Limitations

- No email sending (password resets manual via admin panel)
- No SMS notifications (booking confirmations via WhatsApp link only)
- No file uploads (venue photos not implemented)
- Single admin UID (no role-based admin levels)
- No i18n (Portuguese only)

## Security

- Input sanitization: `src/lib/security/input-sanitizer.ts`
- Rate limiting: `src/lib/security/rate-limiter.ts` (basic IP-based)
- CSP headers in middleware
- Firestore Rules enforce multi-tenant isolation
- Firebase Admin SDK for privileged operations (server-only)

## Debugging

- `/api/debug/firebase-config` - Shows Firebase config (dev only)
- Check browser console for Firebase errors
- Firestore Rules Playground: Test rules in Firebase Console
- Mercado Pago sandbox: Test payments without real money

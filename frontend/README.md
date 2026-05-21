# Desahógate Frontend

React + Vite SPA for the **Desahógate U 2.0** mental-health support platform. It gives users a safe, warm space to vent, get AI-guided support, organize small tasks, and practice micro-actions (breathing and meditation). The frontend is designed mobile-first, with a teal/green/lavender theme, dark-mode support, and a Supabase-backed Google OAuth flow.

## Quick path

1. `cp .env.example .env` and fill the three variables below.
2. `pnpm install`
3. `pnpm dev`
4. Open `http://localhost:5173` and sign in with Google.

The app logo is loaded from **`src/assets/images/logo.png`** via an imported asset. Keep the file present before building for production.

## Required environment variables

| Variable | Purpose | Example |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL (strip `/rest/v1` if present) | `https://xyz.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase public anon key | `eyJ...` |
| `VITE_API_BASE_URL` | Backend base URL (no trailing slash) | `http://localhost:8000/api/v1` |
| `VITE_API_URL` | Legacy fallback, still supported | `http://localhost:8000/api/v1` |

## Integration contract with backend

- **Base URL:** `VITE_API_BASE_URL` (normalized to strip trailing slashes). `VITE_API_URL` remains as a legacy fallback.
- **Authentication:** Every authenticated request sends `Authorization: Bearer <supabase_access_token>`. The token is fetched live from the Supabase session via `supabase.auth.getSession()`.
- **Missing session:** Protected requests fail client-side with `ApiError(401)` instead of calling the backend without a Bearer token.
- **No manual `userId`:** The frontend never sends a user identifier in request bodies for authenticated operations. The backend derives the user from the Bearer token.
- **Main endpoints used**

| Domain | Method | Endpoint | Notes |
|---|---|---|---|
| Users | `GET` | `/users/me` | Creates/returns the current user profile. |
| Chats | `GET` | `/chats` | List user chats. |
| Chats | `POST` | `/chats` | Create a new chat. |
| Chats | `GET` | `/chats/:chatId` | Get single chat. |
| Chats | `PUT` | `/chats/:chatId` | Update chat metadata. |
| Chats | `DELETE` | `/chats/:chatId` | Delete chat. |
| Messages | `GET` | `/messages?chat_id=&limit=&sort=` | List messages for a chat. |
| Messages | `GET` | `/messages/latest/:chatId` | Latest message. |
| Messages | `POST` | `/messages` | `{ chatId, role, content }` |
| Messages | `PUT` | `/messages/:messageId` | Edit message. |
| Messages | `DELETE` | `/messages/:messageId` | Delete message. |
| Stream | `POST` | `/chats/:chatId/messages/stream` | SSE stream for AI response. |
| Tasks | `GET` | `/tasks?task_status=` | List tasks; optional filter. |
| Tasks | `GET` | `/tasks/:taskId` | Get single task. |
| Tasks | `POST` | `/tasks` | `{ title, description?, status }` |
| Tasks | `PUT` | `/tasks/:taskId` | Update task. |
| Tasks | `DELETE` | `/tasks/:taskId` | Delete task. |

**Field alignment:** Backend uses `chatId`, `messageId`, `taskId`, `userId`, `createdAt`, `updatedAt`.

## App architecture overview

```
src/
├── app/               # Bootstrap: router, providers, query client, root App
├── layouts/           # PublicLayout, AuthLayout, AppLayout (shell with sidebar / drawer)
├── pages/             # Route-level views (landing, login, chat, tasks, breathing, meditation, settings, 404)
├── features/          # Domain modules: auth, chat, tasks, user, settings, breathing, meditation
│   ├── auth/          # OAuth sign-in, PKCE callback, session hooks
│   ├── chat/          # Chat CRUD, SSE stream, assistant-ui integration, chat store
│   ├── tasks/         # Task CRUD, filters, status badges
│   ├── user/          # Current user profile, avatar, menu
│   ├── settings/      # Theme, profile, security, notifications
│   ├── breathing/     # Breathing circle animation + 4-7-8 timer hook
│   └── meditation/    # Mood selection, hidden LLM chat, phrase rotation
├── components/
│   ├── ui/            # shadcn/radix primitives (Button, Input, Card, Badge, Avatar, Tabs, Switch, ...)
│   ├── common/        # Logo, LoadingScreen, ErrorState, EmptyState, PageHeader
│   └── marketing/     # Landing page sections (Hero, Features, HowItWorks, Microactions, Pricing, Testimonials, CTA)
├── lib/               # api-client, supabase client, constants, cn (tailwind-merge)
├── stores/            # Zustand stores (theme, ui sidebar/drawer)
├── styles/            # Tailwind entry + global CSS with theme tokens
├── types/             # Shared type aliases (common.types, api.types)
└── assets/            # Static assets (place logo.png here)
```

## File-by-file map

### App bootstrap

| File | Purpose |
|---|---|
| `src/app/App.tsx` | Root component. Wraps the app in `AppProviders` and mounts the router. |
| `src/app/router.tsx` | Browser router with public, auth, micro-action, and app routes. |
| `src/app/providers.tsx` | Global providers: React Query + theme initializer + devtools. |
| `src/app/query-client.ts` | TanStack Query client instance. |

### Layouts

| File | Purpose |
|---|---|
| `src/layouts/PublicLayout.tsx` | Wraps the landing page in the emotional gradient background. |
| `src/layouts/AuthLayout.tsx` | Wraps login/auth pages with wave decorations and emotional gradient. |
| `src/layouts/AppLayout.tsx` | Authenticated shell. Desktop sidebar (collapsible) + mobile nav drawer + teal mobile header. Guards routes with `useRequireAuth`. |

### Pages

| File | Purpose |
|---|---|
| `src/pages/landing/LandingPage.tsx` | Marketing landing: header, nav, hero, features, how-it-works, microactions, pricing, testimonials, CTA, footer. |
| `src/pages/login/LoginPage.tsx` | Google OAuth login screen. |
| `src/pages/auth-callback/AuthCallbackPage.tsx` | Exchanges the PKCE `code` for a Supabase session, then redirects to `/app/chat`. |
| `src/pages/chat/ChatPage.tsx` | Thin wrapper around `ChatShell`. |
| `src/pages/tasks/TasksPage.tsx` | Task management layout: header + form + list. |
| `src/pages/breathing/BreathingPage.tsx` | Full-screen 4-7-8 breathing exercise with animated circle, phase labels, and cycle indicators. |
| `src/pages/meditation/MeditationPage.tsx` | Mood selection → hidden LLM chat → timed phrase display with ambient floating dots and progress bar. |
| `src/pages/settings/SettingsPage.tsx` | Settings shell with sidebar. |
| `src/pages/settings/ProfileSettingsPage.tsx` | Profile editing. |
| `src/pages/settings/ThemeSettingsPage.tsx` | Theme preference selector. |
| `src/pages/settings/SecuritySettingsPage.tsx` | Password and security settings. |
| `src/pages/settings/NotificationsSettingsPage.tsx` | Notification preferences. |
| `src/pages/not-found/NotFoundPage.tsx` | 404 fallback. |

### Features — Auth

| File | Purpose |
|---|---|
| `src/features/auth/api/auth.api.ts` | Google sign-in, PKCE callback exchange (deduped), sign-out, PKCE verifier recovery. |
| `src/features/auth/hooks/useSession.ts` | Syncs Supabase session state and cleans up on unmount. |
| `src/features/auth/hooks/useRequireAuth.ts` | Redirects unauthenticated users to `/login`, preserving the original location. |
| `src/features/auth/components/LoginForm.tsx` | Login form UI. |
| `src/features/auth/components/GoogleLoginButton.tsx` | Google OAuth trigger button. |
| `src/features/auth/components/LogoutButton.tsx` | Sign-out trigger. |

### Features — Chat

| File | Purpose |
|---|---|
| `src/features/chat/api/chat.api.ts` | Chat + message CRUD and SSE streaming endpoint. |
| `src/features/chat/chat.types.ts` | Domain types: `ChatSummary`, `ChatMessage`, `StreamChatInput`, etc. |
| `src/features/chat/store/chat.store.ts` | Zustand store: active chat ID, streaming message buffer, generation flag. |
| `src/features/chat/hooks/useChats.ts` | Queries and mutations for chat list. |
| `src/features/chat/hooks/useChatMessages.ts` | Query for chat message history. |
| `src/features/chat/hooks/useChatStream.ts` | Consumes the SSE stream and appends tokens to the chat store. |
| `src/features/chat/components/ChatShell.tsx` | Main chat layout: header + sidebar + thread/empty state. |
| `src/features/chat/components/ChatHeader.tsx` | Sticky teal gradient header with back button and sidebar toggle. |
| `src/features/chat/components/ChatSidebar.tsx` | Chat list sidebar. |
| `src/features/chat/components/ChatEmptyState.tsx` | Empty state with quick-action cards (breathing, meditation, tasks). |
| `src/features/chat/components/QuickActionCards.tsx` | Three shortcut cards linking to micro-actions and tasks. |
| `src/features/chat/components/ChatDecorations.tsx` | Background visual decorations for the chat area. |
| `src/features/chat/components/ChatProvider.tsx` | Context/provider wrapper for chat state. |
| `src/features/chat/assistant-ui/AssistantThread.tsx` | assistant-ui thread wrapper. |
| `src/features/chat/assistant-ui/AssistantMessage.tsx` | assistant-ui message bubble. |
| `src/features/chat/assistant-ui/AssistantComposer.tsx` | assistant-ui composer / input area. |
| `src/features/chat/assistant-ui/assistant-runtime.ts` | Runtime bridge for assistant-ui. |

### Features — Tasks

| File | Purpose |
|---|---|
| `src/features/tasks/api/tasks.api.ts` | Task CRUD API with backend-to-frontend field mapping. |
| `src/features/tasks/task.types.ts` | Task domain types and status enum. |
| `src/features/tasks/hooks/useTasks.ts` | Queries and mutations for task list, create, update, delete. |
| `src/features/tasks/components/TaskForm.tsx` | Simple form to create a task (title + optional description). |
| `src/features/tasks/components/TaskList.tsx` | Filterable task list (All / Pending / In Progress / Done). |
| `src/features/tasks/components/TaskCard.tsx` | Individual task card with status and delete. |
| `src/features/tasks/components/TaskStatusBadge.tsx` | Colored status badge (yellow / blue / green). |

### Features — Breathing & Meditation

| File | Purpose |
|---|---|
| `src/features/breathing/components/BreathingCircle.tsx` | Animated circle that expands/contracts with breathing phases and color changes. |
| `src/features/breathing/hooks/useBreathingTimer.ts` | 4-7-8 timer: inhale 4s, hold 7s, exhale 8s, rest 1s. Runs 4 cycles. |
| `src/features/meditation/hooks/useMeditationSession.ts` | Mood selection → hidden chat creation → LLM phrase stream → parsed lines with fallback. |

### Features — User & Settings

| File | Purpose |
|---|---|
| `src/features/user/api/user.api.ts` | User profile API. |
| `src/features/user/user.types.ts` | User domain types. |
| `src/features/user/hooks/useCurrentUser.ts` | Query for the current user. |
| `src/features/user/components/UserAvatar.tsx` | Avatar display. |
| `src/features/user/components/UserMenu.tsx` | User dropdown menu. |
| `src/features/settings/settings.types.ts` | Settings domain types. |
| `src/features/settings/hooks/useThemePreference.ts` | Reads/writes theme preference. |
| `src/features/settings/components/ThemeSelector.tsx` | Theme picker UI. |
| `src/features/settings/components/SettingsSidebar.tsx` | Settings navigation sidebar. |
| `src/features/settings/components/PasswordSettingsForm.tsx` | Password change form. |
| `src/features/settings/components/EmailSettingsForm.tsx` | Email change form. |
| `src/features/settings/components/DeleteAccountSection.tsx` | Account deletion UI. |

### Shared infrastructure

| File | Purpose |
|---|---|
| `src/lib/api-client.ts` | Fetch wrapper that injects the Bearer token, sets JSON headers, and throws `ApiError`. |
| `src/lib/supabase.ts` | Supabase client singleton. PKCE flow. Strips `/rest/v1` to avoid double-path bugs. |
| `src/lib/constants.ts` | App name, crisis disclaimer, default history limit. |
| `src/lib/cn.ts` | `clsx` + `tailwind-merge` helper. |
| `src/stores/theme.store.ts` | Zustand theme store (`light` / `dark` / `system`) persisted to `localStorage`. |
| `src/stores/ui.store.ts` | Zustand UI store: sidebar collapse, mobile nav drawer open/close. |
| `src/styles/globals.css` | Tailwind directives + CSS variables for the color system (light & dark). |
| `src/types/common.types.ts` | Shared primitive types (e.g. `ThemePreference`). |
| `src/types/api.types.ts` | Shared API types. |

## UX logic

### Landing intent and sections

The landing page (`LandingPage`) is a single-scroll marketing experience:
1. **Header** — Logo + anchor nav (Beneficios, Cómo funciona, Microacciones, Planes) + CTA button.
2. **Hero** — Emotional headline and primary CTA.
3. **Features** — Value props.
4. **HowItWorks** — Step-by-step explanation.
5. **Microactions** — Teaser for breathing and meditation.
6. **Pricing** — Plans.
7. **Testimonials** — Social proof.
8. **CTA** — Final conversion push.
9. **Footer** — Logo + crisis disclaimer (`CRISIS_DISCLAIMER` from `src/lib/constants.ts`).

### Chat behavior

- The chat shell (`ChatShell`) is a two-column layout: sidebar on the left (chat list), main area on the right.
- If no chat is selected, the main area shows `ChatEmptyState` with quick-action cards.
- Once a chat is selected, `AssistantThread` renders the message thread.
- Messages stream in via SSE (`/chats/:chatId/messages/stream`). Tokens arrive as `type: "token"` events and are appended to the chat store's `streamingMessage`.
- The composer lives inside the assistant-ui integration.

### Quick actions behavior

`QuickActionCards` renders three tappable cards in the chat empty state:
- **Respiración** → `/p/breathing` (blue theme)
- **Meditación Guiada** → `/p/meditation` (green theme)
- **Organizá tus Tareas** → `/app/tasks` (accent/teal theme)

These are mobile-optimized: small font, tight padding on narrow screens, larger on desktop.

### Breathing experience logic

- `BreathingPage` is a full-screen standalone page (no sidebar).
- `useBreathingTimer` drives the **4-7-8 pattern**: inhale 4s, hold 7s, exhale 8s, rest 1s.
- `BreathingCircle` animates scale and color per phase:
  - **Inhale:** scales up over 4s, primary color.
  - **Hold:** holds scale, accent color.
  - **Exhale:** scales down over 8s, secondary color.
  - **Rest:** rests, muted color.
- Four cycles total. Cycle dots show progress below the circle.
- Controls: Start / Pause / Continue / Restart.

### Meditation experience logic

- `MeditationPage` is a full-screen standalone page (no sidebar).
- **Phase 1 — Select:** User picks a mood (Ansioso, Triste, Estresado, Calma, Solo relajarme) or a duration (3 / 5 / 10 min).
- **Phase 2 — Loading:** A spinner appears while the session is prepared.
- **Phase 3 — Meditating:**
  - `useMeditationSession` creates a **hidden chat** via `createChat()`.
  - It sends a prompt to the LLM via `streamChatMessage` asking for 8 short emotional-support phrases tailored to the selected mood.
  - Phrases are parsed by splitting on newlines and filtering empty/short lines.
  - If the LLM fails, a **hardcoded fallback set** of 8 warm phrases is used.
  - Phrases rotate automatically based on session duration divided by phrase count (minimum 4s per phrase).
  - A progress bar at the bottom counts down the session timer.
  - Ambient floating dots and a vignette overlay create atmosphere.
- **Phase 4 — Done:** Timer hits zero; user can reset to select again.

> **Why text phrases instead of TTS?** The meditation feature uses hidden AI-generated text phrases rather than text-to-speech to avoid browser autoplay restrictions, reduce bundle size, and keep the experience lightweight and offline-friendly. Phrases are short and calm by design; users read them at their own pace. This also avoids managing audio assets or third-party TTS latency.

### Tasks mode

- `TasksPage` shows a two-column layout on desktop: `TaskForm` on the left, `TaskList` on the right.
- `TaskForm` is a simple manual form: title + optional description + create button.
- `TaskList` filters by status (All, Pending, In Progress, Done) with colored badges.
- Status colors: pending (yellow), in progress (blue), done (green mint).
- Each task card supports status changes and deletion.

## Theming

### Color system

The palette is built around three emotional tones:
- **Teal (`primary`)** — trust, calm, main actions.
- **Green (`secondary`)** — growth, balance, breathing.
- **Lavender (`accent`)** — softness, meditation, warmth.

Supporting tones:
- **Cream (`background`)** — warm light mode canvas.
- **Muted** — neutral surfaces and borders.
- **Destructive** — error states.

### Dark theme notes

- Dark mode inverts the palette to deep navy/blacks with softer teal/green/lavender accents.
- Emotional gradients (`emotional-bg`, `wave-blue`, `wave-yellow`) are redefined in the `.dark` block with reduced opacity so they don't overwhelm.
- The toggle is handled by `theme.store.ts` adding/removing the `dark` class on `document.documentElement`.

### Where tokens live

- **CSS variables:** `src/styles/globals.css` (`:root` and `.dark`).
- **Tailwind mapping:** `tailwind.config.ts` maps HSL variables to Tailwind utilities (`primary`, `secondary`, `accent`, `muted`, etc.).
- **Custom utilities:** `globals.css` defines `.emotional-bg`, `.wave-blue`, `.wave-yellow`.
- **Store:** `src/stores/theme.store.ts` persists the user's choice (`light` / `dark` / `system`).

## Routing map

### Public routes

| Route | Layout | Page | Access |
|---|---|---|---|
| `/` | `PublicLayout` | `LandingPage` | Public |

### Auth routes

| Route | Layout | Page | Access |
|---|---|---|---|
| `/login` | `AuthLayout` | `LoginPage` | Public (redirects to `/app/chat` if already logged in) |
| `/auth/callback` | — | `AuthCallbackPage` | Public (PKCE exchange) |

### Micro-action standalone routes (no sidebar)

| Route | Page | Access |
|---|---|---|
| `/p/breathing` | `BreathingPage` | Public (no auth gate) |
| `/p/meditation` | `MeditationPage` | Public (no auth gate) |

### App routes (authenticated, `AppLayout` with sidebar/drawer)

| Route | Page | Notes |
|---|---|---|
| `/app` | → `/app/chat` | Redirect |
| `/app/chat` | `ChatPage` | Chat shell |
| `/app/tasks` | `TasksPage` | Task management |
| `/app/settings` | `SettingsPage` | Settings shell |
| `/app/settings/profile` | `ProfileSettingsPage` | Profile editing |
| `/app/settings/theme` | `ThemeSettingsPage` | Theme preference |
| `/app/settings/security` | `SecuritySettingsPage` | Password/security |
| `/app/settings/notifications` | `NotificationsSettingsPage` | Notification prefs |

### Catch-all

| Route | Page |
|---|---|
| `*` | `NotFoundPage` |

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| **Missing logo / broken image** | `src/assets/images/logo.png` does not exist. | Add your logo PNG to `src/assets/images/logo.png`. |
| **Stale Vite cache or import errors** | Vite caches module graphs aggressively. | Stop dev server, run `pnpm dev` again; hard-refresh browser (`Ctrl+Shift+R` or `Cmd+Shift+R`). |
| **PKCE verifier error after OAuth** | Duplicate callback exchange, session already present, or redirect URL mismatch. | Clear site data/cookies; verify Supabase redirect URL matches `window.location.origin + "/auth/callback"`. |
| **Backend returns 401 / 403** | Supabase token expired or not sent; backend CORS block. | Check Network tab for `Authorization: Bearer ...` header; verify backend CORS allows your frontend origin. |
| **CORS preflight fails** | Backend missing `Access-Control-Allow-Origin`. | Add frontend origin to backend CORS config. |
| **SSE stream not starting / aborts** | Network error or SSE parsing mismatch. | Confirm backend endpoint exists; check `Accept: text/event-stream` is sent (handled by `chat.api.ts`). |
| **Meditation phrases not changing** | LLM returned malformed text or empty lines. | Check browser console; fallback phrases will still display. Verify `VITE_API_URL` is reachable. |
| **Build warnings about chunk size** | Large dependencies (React, assistant-ui, Supabase). | Expected. If you need to split further, use Vite `manualChunks` in `vite.config.ts`. |

## Safe editing guide

| I want to... | Where to go |
|---|---|
| **Change marketing copy** | `src/pages/landing/LandingPage.tsx` and `src/components/marketing/*` |
| **Change UI text / labels** | `src/pages/*/`, `src/features/*/components/`, `src/lib/constants.ts` |
| **Change colors** | `src/styles/globals.css` (CSS vars) → then `tailwind.config.ts` if adding new tokens |
| **Change API contract mapping** | `src/features/*/api/*.api.ts` |
| **Change AI prompts** | `src/features/meditation/hooks/useMeditationSession.ts` (system prompt builder) |
| **Change breathing timing** | `src/features/breathing/hooks/useBreathingTimer.ts` — edit `PHASES` array durations |
| **Change meditation moods / phrase generation** | `src/pages/meditation/MeditationPage.tsx` (mood list) and `src/features/meditation/hooks/useMeditationSession.ts` (prompt + parsing + fallback phrases) |
| **Change auth behavior** | `src/features/auth/api/auth.api.ts` and `src/lib/supabase.ts` |
| **Change global styles** | `src/styles/globals.css` and `tailwind.config.ts` |
| **Add a new route** | `src/app/router.tsx` |
| **Add a new global provider** | `src/app/providers.tsx` |
| **Change the app name / disclaimer** | `src/lib/constants.ts` |

## Deployment checklist for demo / day-of-use

- [ ] `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_URL` are set in the deployment environment.
- [ ] `src/assets/images/logo.png` exists and is committed.
- [ ] Supabase Auth → Providers → Google is enabled with valid Client ID / Secret.
- [ ] Supabase Auth → URL Configuration has the production Site URL.
- [ ] Supabase Auth → URL Configuration has the production `/auth/callback` redirect URL.
- [ ] Backend CORS allows the production frontend origin.
- [ ] Backend is reachable at the configured `VITE_API_URL`.
- [ ] `pnpm build` succeeds with no TypeScript errors.
- [ ] `dist/` is served by a static host (or Docker image) with fallback to `index.html` for SPA routes.
- [ ] Test login flow end-to-end in production (Google OAuth → callback → `/app/chat`).
- [ ] Test a chat message stream end-to-end.
- [ ] Test task creation and status change.
- [ ] Test breathing and meditation on a mobile device.
- [ ] Verify dark mode toggle works and persists across reloads.

## Build

```bash
pnpm build
```

Outputs to `dist/`. Type-check runs first (`tsc -b`), then Vite bundles.

## Tech stack

- React 18 + Vite
- TypeScript
- React Router (v6)
- TanStack Query (React Query)
- Zustand
- Tailwind CSS + shadcn/ui primitives
- Supabase Auth (PKCE / Google OAuth)
- assistant-ui (chat thread UI)
- Lucide React (icons)

# VeriART Design System (v3)

Authoritative spec for both frontends (`art-connect-frontend` and `admin-frontend`).
Every product surface — logins, registrations, onboarding, dashboards, tables — uses
these tokens. Marketing pages (home/about/contact) keep their creative treatments but
align to the same palette and fonts.

## Brand colors

| Token | Hex | Role |
|---|---|---|
| `--color-primary` | `#193A57` | Primary actions, donor-context accents (Donor in CRM) |
| `--color-secondary` | `#0FA4A6` | Secondary actions, bank-context accents (Bank in CRM) |
| `--color-tertiary` | `#E8DDD2` | Minor & sensitive areas, patient/clinic-context accents |
| `--color-background` | `#FAFEFF` | App background |
| `--color-ink` | `#494F55` | Body text and emphasis (Admin in CRM) |

Role-accent convention: each portal leans on its CRM color **as an accent** over the
shared neutral chassis — donor surfaces lean primary, bank surfaces secondary,
patient/clinic surfaces tertiary, admin surfaces ink. One design, four accents.

Status colors (badges, banners): success `green-700/green-50`, danger `red-700/red-50`,
warning `amber-700/amber-50`, info `blue-700/blue-50`, neutral `gray-600/gray-50` —
always through the `StatusBadge` component, never inline ternaries.

## Typography

| Token | Font | Role |
|---|---|---|
| `--font-hero` | **Inter** (700–800) | Hero headings, page titles |
| `--font-heading` | **Merriweather** | Section subheadings, serif accents |
| `--font-body` | **Geist** (Inter fallback) | Body copy, UI labels, forms |
| `--font-mono` | **Geist Mono** | Tables, IDs, dense data, code-like values |

All fonts load via `next/font` with `display: swap`.

## Spacing & shape

- 8px spacing grid: `gap-6` / `gap-8` between sections, `p-4`–`p-6` inside cards.
- Radii: `rounded-lg` (8px) for inputs/buttons/cards, `rounded-2xl` (16px) for modals
  and feature cards, `rounded-full` for badges/avatars.
- Shadows: `shadow-sm` on cards, `shadow-xl` on overlays. No bespoke box-shadows.

## Component inventory (shared per app, identical APIs)

| Component | Purpose |
|---|---|
| `ConfirmDialog` / `useConfirm()` | Promise-based confirm + input dialogs (replaces all native alert/confirm/prompt) |
| `StatusBadge` | Keyword-classified status pills |
| `TablePrimitives` (`TableShell`, `TableSkeleton`, `EmptyState`, `Pagination`) | Consistent table chrome |
| `Tooltip` | Hover/focus tooltip for icon buttons |
| `FirstRunHint` | Dismissible first-visit guidance callout |
| `RouteGuard` | Client-side auth gating per role section |
| `DocumentViewer` | In-app secure document viewing via signed URLs |
| `SWRProvider` | Global live-data config (focus revalidation, queue polling) |
| sonner `<Toaster />` | Toast notifications (`richColors`, top-right) |

shadcn/ui primitives (button, input, card, table, dialog, select, tabs, badge,
skeleton, sheet) are themed to the tokens above; the components listed keep their
public APIs on top of those primitives.

## Interaction rules

- Feedback for every action: success/error toast, never silent.
- Destructive actions always pass through `useConfirm({ destructive: true })`.
- Lists revalidate on window focus; queue pages poll every 30s; mutations call
  `mutate()` — users never reload manually.
- Documents open in the in-app viewer (`/<section>/documents/view?url=…`) via
  short-lived signed URLs; raw storage URLs are never exposed.
- Icon-only buttons get a `Tooltip`; each dashboard greets first-time users with one
  dismissible `FirstRunHint`.
- Loading = skeletons (`TableSkeleton`) for tables, spinner only for full-page waits.
- Empty states always say what the screen is for and offer the next action.

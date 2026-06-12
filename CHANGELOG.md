# Changelog

All notable changes to the VeriART admin frontend.

## [Unreleased]

### Added
- In-app document viewer (`/documents/view`) resolving signed URLs server-side —
  documents no longer open as raw storage URLs in a new tab.
- SWR live-data layer: dashboards and queues auto-refresh (30s polling + focus
  revalidation); actions update lists via `mutate()` without reloads.
- Brand fonts (Inter/Merriweather/Geist, `.font-data` mono utility), restyled
  login on the shared VeriART card template, path-based breadcrumbs.
- Railway-host → `NEXT_PUBLIC_CANONICAL_HOST` permanent redirect.

### Changed
- Shared StatusBadge across banks/donors/documents/subscriptions tables and
  detail pages (title-case labels; per-page badge helpers removed).

## [Gate 1] - 2026-06-12

### Added
- Branded 404 / error / global-error pages.
- Security headers + production console stripping via `next.config.ts`.
- Toast system (sonner) + promise-based `ConfirmDialog` (input mode for notes
  and rejection reasons), `StatusBadge`, table primitives, `Tooltip`, `FirstRunHint`.
- Client-side auth guard in `DashboardLayout` (redirects to /login without a token).
- `getApiErrorMessage` helper.

### Changed
- All 70 native `alert()/confirm()/prompt()` sites replaced with toasts and
  in-app dialogs.
- Login page: real portal copy (replaced leftover template text); dev autofill
  hidden unless `NEXT_PUBLIC_SHOW_DEV_LOGIN=true`.
- Donor-create modal validates names (no digits), email and phone formats.

### Fixed
- Two pre-existing type errors that were breaking the production build
  (`PendingDocument` fields; bank certification verify/reject now call the
  index-based endpoints that actually exist on the backend).

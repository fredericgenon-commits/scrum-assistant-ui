# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — `ng serve` on `http://localhost:4200` (dev configuration, source maps on, optimization off).
- `npm run build` — production build by default; pass `-- --configuration development` for an unoptimized build (used to surface Angular template type errors).
- `npx tsc --noEmit` — pure TS type-check. Does NOT catch Angular template errors (those require `ng build`, because `strictTemplates` is on).
- `npm test` — `ng test`. No specs exist in the tree yet; the script is wired but the runner has nothing to execute.
- `npm run lint` — `ng lint`. No linter is configured in `angular.json`, so this currently errors out until one is added.
- `start.cmd` — Windows convenience wrapper that puts Node on PATH and runs `ng serve` (the user double-clicks this).

## Architecture

Angular 21 standalone-component SPA, no NgModules. Material 21 for UI. French locale (`fr-FR`) is registered globally in `src/app/app.config.ts` and applied to both `LOCALE_ID` and `MAT_DATE_LOCALE`.

**Backend coupling.** The app is a thin REST client — it has no persistence and no auth. Base URL is `environment.apiUrl` (`http://localhost:8080/api/ui` in dev). Every service in `src/app/core/services/` follows the same shape: `inject(HttpClient)`, `baseUrl = ${environment.apiUrl}/<resource>`, CRUD methods returning `Observable<T>`. When adding a new resource, mirror `sprint.service.ts`.

**Cross-cutting error handling.** `core/interceptors/error.interceptor.ts` is registered via `provideHttpClient(withInterceptors([...]))` and surfaces every HTTP failure through `MatSnackBar`. Don't reimplement try/catch error UI inside components — let it bubble.

**Routing & code-splitting.** `src/app/app.routes.ts` uses `loadComponent: () => import(...)` for every feature route, so each feature lazy-loads as its own chunk. The root path redirects to `/reports`. The `Jira Tickets` feature folder exists but is intentionally not wired into the menu or routes (see `docs/functional-documentation.md` §3).

**Layout shell.** `app.component.ts` owns the permanent `mat-sidenav` shell, the light/dark theme toggle (persisted in `localStorage`), and the version label. Feature components render into `<router-outlet>`; they should not redefine global chrome.

**Folder layout (`src/app/`).**
- `core/` — singletons: `models/` (typed DTOs, re-exported via `models/index.ts`), `services/` (HTTP clients), `interceptors/`.
- `features/<name>/` — one folder per route group. Each contains a `*-list.component.ts` (route entry) and a `*-form-dialog.component.ts` (Material dialog for create/edit). `reports/` additionally has `developer-detail.component.ts` reached by clicking a report row.
- `shared/` — reusable bits: `components/confirm-dialog/` for destructive-action confirmations, `utils/time-format.util.ts` for minute↔display conversions.

**Path aliases** (defined in `tsconfig.json`): `@core/*`, `@features/*`, `@shared/*`, `@env`. Existing code mostly uses relative imports — match the surrounding file's style rather than introducing a mix.

**TS / template strictness.** `tsconfig.json` has `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, plus Angular's `strictTemplates` and `strictInjectionParameters`. Inline templates in `@Component({ template: ... })` are type-checked against the component class — most "type errors" in this repo come from template bindings, not `.ts` files.

**Modern Angular conventions used throughout.**
- DI via `inject()`, not constructor parameters.
- Reactive state via `signal()` / `computed()` / `effect()` — see `report-dashboard.component.ts` and `app.component.ts`.
- Control flow with `@for` / `@if` blocks, not `*ngFor` / `*ngIf`.
- All components are `standalone: true` with explicit `imports: [...]`.

## Repository notes

- This repo has two remotes: `origin` (GitLab) and `github`. `master` tracks GitHub. Be explicit about which remote when pushing.
- Functional spec lives at `docs/functional-documentation.md` — read it before changing report logic or navigation, since it documents intended UX (e.g. business-day computation in `report-dashboard.component.ts`).

## Notes
- Use english in codes and documentation.  Use french to speak with me.
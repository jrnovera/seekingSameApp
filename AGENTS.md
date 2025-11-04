# Repository Guidelines

## Project Structure & Module Organization
- `app/` holds Expo Router routes (e.g. `(tabs)`, `conversation`, `host`); keep segment folders kebab-case and pair global layouts with `_layout.tsx`.
- `components/` contains reusable UI; shared atoms live in `components/ui`, and screen specific elements stay near their route.
- `services/`, `stores/`, and `data-stores/` centralize Firebase, Stripe, and MobX or Zustand logic; isolate side effects here.
- `hooks/`, `contexts/`, `constants/`, `utils/`, `types/`, and `assets/` provide cross cutting concerns; `scripts/reset-project.js` resets the Expo template.

## Build, Test, and Development Commands
- `npm install` installs dependencies; rerun after syncing with `main`.
- `npm run start` launches the Expo dev server; use `npm run android`, `npm run ios`, or `npm run web` for platform targets.
- `npm run lint` runs ESLint with the Expo config; fix all warnings before pushing.
- `npm run reset-project` restores the blank starter; do not run once custom routes exist.

## Coding Style & Naming Conventions
- TypeScript is required; prefer explicit interfaces from `types/` and 2 space indentation.
- Name shared components in PascalCase (`PropertyInfoModal.tsx`), hooks in camelCase prefixed with `use`, and Expo routes in kebab-case (`group-chat/messages.tsx`).
- Keep styling co-located with components and reuse theme helpers from `themed-text` and `themed-view`.

## Testing Guidelines
- Automated tests are not configured; prioritise modular logic in `utils/` or `services/` and add Jest plus React Native Testing Library when introducing tests.
- Place future specs in a `__tests__/` folder or alongside modules as `.test.tsx`; document manual QA steps in the PR until Jest exists.
- Smoke test critical flows in Expo Go (`npm run start`) and capture device logs when reporting issues.

## Commit & Pull Request Guidelines
- Follow `type(scope): summary`, e.g. `feat(group-chat): throttle infinite scroll`, to replace generic messages like update.
- Squash work into focused commits that pass linting; reference issue IDs in the scope when relevant.
- PRs must include a narrative summary, screenshots or screen recordings for UI changes, a checklist of manual QA commands, and confirmation that secrets remain out of `.env`.
- Request at least one review before merging and wait for CI once automated tests land.

## Security & Configuration Tips
- Copy `backup.env` to `.env` for local secrets; never commit real keys and prefer `expo-constants` for runtime access.
- Document new permissions or credentials in `config/README` (create if missing) and surface breaking changes in `README.md`.

# Dependency refresh, November 2026

Updated 48 direct dependency ranges to current stable patch/minor releases, including compatible zero-major updates. Refreshed transitive dependencies and both npm and Bun lockfiles. No forced or legacy peer resolution was used.

## Validation

- Production build passed.
- Application TypeScript check passed (`tsc --noEmit -p tsconfig.app.json`).
- Complete npm dependency tree resolves with no invalid peers (`npm ls --all`).
- ESLint has 22 errors and 17 warnings, identical to the pre-update baseline. These existing findings are not hidden or disabled by this change.
- Browser smoke tests could not run in this execution environment: Chromium aborted on a prohibited local socket operation. This is not a browser-test pass.
- No npm audit was run. This refresh does not claim a clean security audit.

## Browser regression coverage

A PR-only GitHub Actions workflow runs npm install validation, peer resolution, TypeScript, production build, and anonymous desktop/mobile route rendering plus reload tests. External sign-in, paid AI APIs, and production data writes are not exercised. Local Chromium remains unavailable; check the PR workflow result for browser validation status.

## Remaining major-version migrations

This is a compatible dependency refresh, not a claim that every package is on its latest major. The existing React 18, Tailwind 3, DayPicker 8, chart/resizable component APIs, Zod 3 and Vite 6 toolchain are retained. Their next majors need separate coordinated migrations and UI regression validation rather than forced peer overrides. React type packages stay aligned with the runtime; Node types remain on the existing Node 22 target. Other available majors were not validated in this refresh.

| Package | Installed | Latest registry version at check |
| --- | --- | --- |
| @eslint/js | 9.39.5 | 10.0.1 |
| @hookform/resolvers | 3.10.0 | 7.0.5 |
| @types/node | 22.20.5 | 26.6.6 |
| @types/react | 18.3.31 | 19.3.0 |
| @types/react-dom | 18.3.7 | 19.3.0 |
| @vitejs/plugin-react-swc | 3.11.0 | 4.3.3 |
| date-fns | 3.6.0 | 4.4.0 |
| eslint | 9.39.5 | 10.14.0 |
| eslint-plugin-react-hooks | 5.2.0 | 7.1.1 |
| firebase | 12.19.0 | 13.3.0 |
| framer-motion | 12.43.0 | 14.12.0 |
| globals | 15.15.0 | 17.14.0 |
| lucide-react | 0.577.0 | 1.72.0 |
| react | 18.3.1 | 19.3.1 |
| react-day-picker | 8.10.2 | 10.0.2 |
| react-dom | 18.3.1 | 19.3.1 |
| react-resizable-panels | 2.1.9 | 4.21.0 |
| react-router-dom | 6.30.6 | 7.18.5 |
| recharts | 2.15.4 | 3.10.1 |
| sonner | 1.7.4 | 2.0.8 |
| tailwind-merge | 2.6.1 | 3.7.0 |
| tailwindcss | 3.4.19 | 4.3.5 |
| typescript | 5.9.3 | 7.0.2 |
| vaul | 0.9.9 | 1.1.2 |
| vite | 6.4.6 | 8.3.8 |
| zod | 3.25.76 | 4.6.7 |

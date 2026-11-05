# Security toolchain update — 2026-10-24

Base: 8579886c033dd95e3c6aab2fde3832c4bde74c51 on existing fix/security-audit-20261024 branch.

Vite 5.4.19 -> 6.4.5.
react-swc 3.11.0 -> 3.11.0.
lovable-tagger 1.1.10 -> 1.1.13.

Applied semver-compatible audit fixes with install scripts disabled. No audit --force or major transitive overrides.
Use npm ci; package-lock.json is the authoritative repaired dependency graph. Stale root Bun lockfiles are retired to prevent reinstalling vulnerable versions.

Windows Node 24.16.0: production build passed. Lint reports source errors; it does not pass. Authenticated browser/backend workflows are not verified.

Existing loopback and security changes are preserved. No merge, production deployment, grants, secrets, or cross-account migration was performed.

Official Vite advisories: GHSA-rq7h-c2jc-7f22; GHSA-9jrq-w75r-8gcw; GHSA-8g5g-mxqh-grgj.


## Completed second pass

Removed unused Zod and @hookform/resolvers after checking tracked source imports. Migrated React Router DOM 6.x to 7.18.4; React 18 is retained. The applications use simple wildcard fallback routes and do not use the affected multi-segment relative splat patterns.

All production builds and real Chromium 404-to-home navigation smoke checks passed with external requests blocked. This does not verify authenticated backend workflows. Existing source lint failures remain outside this dependency update.

Full npm audit: 0 critical / 0 high / 5 moderate / 0 low. Production npm audit: 0 critical / 0 high / 3 moderate / 0 low. The remaining npm audit records concern the PostCSS selector-parser/Tailwind 3 toolchain (GHSA-rj75-hqrm-r3gf); see the upstream backport assessment below. No major parser override, audit suppression, or audit --force was used. Production audit includes build tooling brought in by the current dependency classification; it is not proof of runtime exploitability.

Firebase 12.4.0 is retained. A targeted @firebase/firestore override upgrades @grpc/grpc-js from the vulnerable 1.9 line to 1.13.6 (same major, patched release), avoiding the audit-suggested Firebase downgrade. The actual installed Firebase client passed owner write/read/delete and non-owner read denial against the local demo Firestore emulator. grpc.test.cjs is the repeatable test; start a demo-security-audit emulator on 127.0.0.1:8787 with ownership rules before running node --test grpc.test.cjs. Never point this fixture at production.

No merge or production deployment was performed in either pass.

## CSS advisory backport assessment

The upstream advisory now lists 6.1.5 as patched, alongside 7.1.6: https://github.com/postcss/postcss-selector-parser/security/advisories/GHSA-rj75-hqrm-r3gf . The npm audit data retrieved during this run still classifies all versions below 7.1.6 as affected. Preserve this raw discrepancy; do not suppress findings or claim the audit is zero.

The main parser was already 6.1.5. A scoped same-major override updates typography's exact 6.0.10 dependency to 6.1.5; every installed parser is now the upstream-patched backport. This avoids a Tailwind 4 migration. Tracked source imports only reference Tailwind from build configuration; no application request path importing the selector parser was found. Ordinary trusted-source build-time use is outside the exploit path described upstream. Untrusted source/build inputs still deserve review.

All seven production builds and Chromium navigation smoke tests were rerun. Math initially rejected an incorrectly formatted fixture key, then passed with the unchanged CI fixture configuration; deployment guards remained enabled.

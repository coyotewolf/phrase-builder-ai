# Security toolchain update — 2026-10-24

Base: 8579886c033dd95e3c6aab2fde3832c4bde74c51 on existing fix/security-audit-20261024 branch.

Vite 5.4.19 -> 6.4.5.
react-swc 3.11.0 -> 3.11.0.
lovable-tagger 1.1.10 -> 1.1.13.

Applied semver-compatible audit fixes with install scripts disabled. No audit --force or major transitive overrides.
Use npm ci; package-lock.json is the authoritative repaired dependency graph. Stale root Bun lockfiles are retired to prevent reinstalling vulnerable versions.

Windows Node 24.16.0: production build passed. Lint reports source errors; it does not pass. Authenticated browser/backend workflows are not verified.
Full audit: 5 high / 7 moderate / 0 low / 0 critical.
Production audit: 5 high / 5 moderate / 0 low / 0 critical.
Remaining findings require separately tested migrations. A version finding does not demonstrate compromise.

Existing loopback and security changes are preserved. No merge, production deployment, grants, secrets, or cross-account migration was performed.

Official Vite advisories: GHSA-rq7h-c2jc-7f22; GHSA-9jrq-w75r-8gcw; GHSA-8g5g-mxqh-grgj.

Remaining high findings include Firebase/gRPC and Zod. Do not accept the audit-suggested Firebase downgrade without compatibility assessment.

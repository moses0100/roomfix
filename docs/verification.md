# Verification record — 2026-10-08

Local environment: Windows, Docker Linux, PHP 8.4, PostgreSQL 17, Node 24, installed Chrome.

- `npm run build`: TypeScript and Vite pass; production assets generated.
- `docker compose exec -T app vendor/bin/pint --test`: 45 PHP files pass Laravel formatting.
- `docker compose exec -T app php artisan test --compact`: 14 tests pass, 163 assertions. Feature database is in-memory SQLite. PostgreSQL demo users checked after the suite and preserved.
- `npm run test:e2e`: 3 tests pass against real Laravel/PostgreSQL in Chrome. The workflow covers resident creation + PNG upload, cross-resident 403, manager assignment, technician start/finish, resident confirmation, comment history, notifications, manager account creation/search, and mobile navigation/overflow.
- Private data snapshot `verified-v1`: pg_dump + 1 private photo, checksums recorded. Restored to a **new database**, verified 5 users / 7 tickets / 1 photo / 16 audit events. The running database and source photo were preserved.

The local data is fictional demo/test data. No public hosting has been provisioned. Screenshots contain demo names only. Playwright failure reports and data snapshots are excluded from Git.

## Issues found and fixed during verification

Docker database variables also appear in `$_SERVER`, which can override PHPUnit env values. The first local test run used the new demo database; its sample rows were restored. `Tests/TestCase.php` now sets all database values **before application boot** and verifies SQLite `:memory:` before RefreshDatabase runs. A repeat suite preserved the PostgreSQL application database.

PHP dependency access through a Windows bind mount made login slow enough to fail browser assertions. Dependencies moved to a Linux named volume, with opcode caching enabled. The same browser assertions passed without extending their timeouts.

Generic Laravel signed private-file serving is disabled. Photos are returned only through the controller after checking the current ticket's policy and photo-ticket association.

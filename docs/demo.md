# Isolated portfolio demo

This runtime is separate from the existing app on port 8003. It uses its own PostgreSQL container/database (`roomfix_demo`), app key, session cookie, and named volumes for private storage, dependencies and bootstrap caches. It remains bound to localhost on port 8004 and uses the PHP development server; public HTTPS hosting is a separate deployment task.

## Start

```sh
node scripts/init-demo.mjs
npm run build
docker compose -f compose.demo.yaml build app
docker compose -f compose.demo.yaml up -d database
docker compose -f compose.demo.yaml run --rm --no-deps app composer install --no-dev --no-interaction --prefer-dist
docker compose -f compose.demo.yaml up -d app
docker compose -f compose.demo.yaml exec -T app php artisan migrate --force
docker compose -f compose.demo.yaml exec -T app php artisan db:seed --class=DemoSeeder --force
```

Open http://127.0.0.1:8004. Select a demo role on the login screen, then sign in. `init-demo.mjs` generates private credentials without printing them and refuses to overwrite `.env.demo`. Keep that file private. Do not replace its app key while sessions are active.

Shared fictional accounts can create and process repair requests. Account creation and password changes are blocked on the server and hidden in the UI. Users see a banner explaining that the dataset is shared and may be reset. Never enter personal information or upload private photos into a public demo.

The demo is isolated from the real/local app, but visitors using the same demo role share the same account and data. It is not a separate sandbox per visitor.

## Reset sample data

Only the operator can reset, through CLI:

```sh
docker compose -f compose.demo.yaml exec -T app php artisan roomfix:demo-check
docker compose -f compose.demo.yaml exec -T app php artisan roomfix:demo-reset --confirm=roomfix_demo
```

`demo-check` performs read-only configuration/database validation. Use this check when validating a suspected wrong target; never test the reset command against important data.

The command requires both demo flags and checks the actual PostgreSQL database name. It refuses the main database and missing/mistyped confirmation. It temporarily enters maintenance mode, waits for in-flight demo web requests using PostgreSQL advisory locks, and replaces fictional records in a transaction. A failed seed rolls back records and restores web access. Sessions are invalidated and the original four accounts/six sample tickets restored. Ticket IDs can increase between resets.

No reset route is exposed through HTTP. No automatic reset schedule is enabled. Private uploaded files are retained in the demo-only volume; old photo records disappear, so these files are no longer accessible through ticket routes. Monitor volume size and set an explicit retention policy before public hosting. This command is not a backup/restore mechanism for real resident data.

## Verify

```powershell
$env:PLAYWRIGHT_BASE_URL='http://127.0.0.1:8004'
$env:ROOMFIX_E2E_DEMO='true'
npm run test:e2e -- tests/e2e/demo.spec.ts
```

The normal browser suite skips the dedicated demo test unless explicitly enabled. GitHub Actions starts a separate demo runtime, checks its UI and fictional repair workflow, and runs its reset command.

Do not combine the demo and regular Compose files as overrides. Run `-f compose.demo.yaml` by itself. Do not point the demo at another database or reuse the original app's storage/cache volumes. `serve --no-reload` preserves the isolated container environment in the child PHP process. For public hosting use PHP-FPM/web server, HTTPS, secure cookies, upload retention and operational monitoring.

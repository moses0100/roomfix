# Deploying RoomFix

The included Docker Compose is for local development. It binds only 127.0.0.1 and runs PHP's development server. For a public instance:

1. Use PHP 8.4 FPM with PostgreSQL, intl, mbstring, XML and zip extensions. Serve **only public/** through Nginx/Caddy. Build frontend assets with npm ci && npm run build and install Composer dependencies without dev packages.
2. Use a fresh production database and unique secrets. Set APP_ENV=production, APP_DEBUG=false, ROOMFIX_DEMO=false, APP_URL to the HTTPS origin, SESSION_SECURE_COOKIE=true. Generate APP_KEY once and retain it safely. Never run DemoSeeder against production or expose local sample accounts.
3. Run php artisan migrate --force. Create the initial manager interactively: php artisan roomfix:manager manager@example.com --name="Building manager". The command hides the password prompt and validates confirmation. No default production account is installed.
4. Make storage and bootstrap/cache writable by the application user. Persist storage/app/private outside ephemeral releases. Do not expose it through a public storage symlink. Keep PHP upload_max_filesize >=3M and post_max_size >=8M; equivalent limits must also be set on the reverse proxy.
5. Configure only known trusted proxies for forwarded HTTPS/IP headers if hosted behind a proxy. Keep the database on a private network, monitor login failures and errors, and use TLS. Cache config/routes/views for releases. Don't share the APP_KEY or .env in a repository.
6. Take database AND private-file snapshots before migrations. Test restore independently. Use a managed database or durable volume and restrict backup access; backups contain personal data and password hashes.
7. Provide an account recovery process and a private channel for initial credentials. This MVP has no email password reset, forced initial-password rotation, tenancy isolation between buildings, retention/deletion workflow, or emergency dispatch. Notifications are synchronous database entries, not outbound messages or realtime pushes.

Do not expose this local PHP dev server directly to the internet. Production hosting has not been provisioned by this repository.

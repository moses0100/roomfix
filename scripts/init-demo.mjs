import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const target = resolve(root, ".env.demo");
if (existsSync(target))
    throw new Error(".env.demo exists; preserved without changes.");
const password = randomBytes(24).toString("hex");
const source = readFileSync(resolve(root, ".env.demo.example"), "utf8")
    .replace(
        /^APP_KEY=\r?$/m,
        `APP_KEY=base64:${randomBytes(32).toString("base64")}`,
    )
    .replace(/^DB_PASSWORD=\r?$/m, `DB_PASSWORD=${password}`)
    .replace(/^POSTGRES_PASSWORD=\r?$/m, `POSTGRES_PASSWORD=${password}`);
writeFileSync(target, source, { flag: "wx", mode: 0o600 });
console.log(
    "Created private .env.demo with a separate app key and database password.",
);

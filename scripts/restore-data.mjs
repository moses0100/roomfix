import { spawnSync } from "node:child_process";
import {
    mkdirSync,
    readFileSync,
    writeFileSync,
    existsSync,
    copyFileSync,
} from "node:fs";
import { resolve, join, dirname, sep } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, ".."),
    label = process.argv[2] ?? "";
if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,60}$/.test(label))
    throw new Error("Pass a backup label");
const backup = join(root, "backups", "data", label);
const manifest = JSON.parse(
    readFileSync(join(backup, "manifest.json"), "utf8"),
);
if (
    manifest.version !== 1 ||
    manifest.label !== label ||
    !Array.isArray(manifest.files)
)
    throw new Error("Invalid snapshot manifest");
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
const dump = readFileSync(join(backup, "database.dump"));
if (hash(dump) !== manifest.sha256)
    throw new Error("Database checksum mismatch; restore stopped");
for (const file of manifest.files) {
    const path = resolve(backup, "private", file.path);
    if (
        typeof file.path !== "string" ||
        !file.path.startsWith("ticket-photos/") ||
        !path.startsWith(join(backup, "private") + sep) ||
        file.path.includes("..") ||
        hash(readFileSync(path)) !== file.sha256
    )
        throw new Error("Unsafe or corrupted attachment; restore stopped");
}
const database = `roomfix_restore_${Date.now()}`;
function docker(args, input) {
    const r = spawnSync(
        "docker",
        ["compose", "exec", "-T", "database", ...args],
        { cwd: root, input, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
    );
    if (r.status !== 0)
        throw new Error(
            r.stderr ?? "Restore failed; the original database is unchanged",
        );
    return r.stdout;
}
// Create a separate database. Never drop, clean, or overwrite the running one.
docker(["createdb", "-U", "roomfix", database]);
docker(
    [
        "pg_restore",
        "-U",
        "roomfix",
        "-d",
        database,
        "--no-owner",
        "--no-acl",
        "--exit-on-error",
    ],
    dump,
);
const recovery = join(root, "rollback-recovery", `${label}-${Date.now()}`);
if (existsSync(recovery))
    throw new Error("Recovery destination already exists");
mkdirSync(recovery, { recursive: true });
for (const file of manifest.files) {
    const target = join(recovery, "private", file.path);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(backup, "private", file.path), target);
}
const counts = docker([
    "psql",
    "-U",
    "roomfix",
    "-d",
    database,
    "-t",
    "-A",
    "-c",
    "SELECT json_build_object('users',(SELECT count(*) FROM users),'tickets',(SELECT count(*) FROM tickets),'photos',(SELECT count(*) FROM ticket_photos),'events',(SELECT count(*) FROM ticket_events));",
]).trim();
writeFileSync(
    join(recovery, "restore.json"),
    JSON.stringify(
        {
            database,
            source: label,
            counts: JSON.parse(counts),
            photos: manifest.files.length,
            createdAt: new Date().toISOString(),
        },
        null,
        2,
    ) + "\n",
);
console.log(
    `Restored safely into NEW database: ${database}\nRecovered private files: ${recovery}\nVerified counts: ${counts}\nRunning database and uploads were preserved. Review docs/recovery.md before switching.`,
);

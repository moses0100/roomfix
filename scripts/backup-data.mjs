import { spawnSync } from "node:child_process";
import {
    mkdirSync,
    readFileSync,
    writeFileSync,
    existsSync,
    readdirSync,
    lstatSync,
    copyFileSync,
} from "node:fs";
import { resolve, join, relative, sep } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, "..");
if (existsSync(join(root, "storage", "framework", "down")))
    throw new Error(
        "Application is already in maintenance mode; its state was preserved",
    );
const label = process.argv[2] ?? `data-${Date.now()}`;
if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,60}$/.test(label))
    throw new Error("Use a simple unique backup label");
const database = process.argv[3] ?? "roomfix";
if (!/^[a-z][a-z0-9_]{0,60}$/.test(database))
    throw new Error("Invalid database name");
const destination = join(root, "backups", "data", label);
if (existsSync(destination))
    throw new Error("Backup already exists; refusing to overwrite");
function docker(args, binary = false) {
    const r = spawnSync("docker", ["compose", ...args], {
        cwd: root,
        encoding: binary ? undefined : "utf8",
        maxBuffer: 128 * 1024 * 1024,
    });
    if (r.status !== 0)
        throw new Error(r.stderr?.toString() ?? "Docker command failed");
    return r.stdout;
}
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
const files = [];
function copyPhotos(directory) {
    if (!existsSync(directory)) return;
    for (const item of readdirSync(directory)) {
        const source = join(directory, item),
            stat = lstatSync(source);
        if (stat.isSymbolicLink())
            throw new Error(
                "Symlinks are not allowed in private photo backups",
            );
        if (stat.isDirectory()) copyPhotos(source);
        else {
            const name = relative(
                join(root, "storage", "app", "private"),
                source,
            )
                .split(sep)
                .join("/");
            const target = join(destination, "private", name);
            mkdirSync(resolve(target, ".."), { recursive: true });
            copyFileSync(source, target);
            files.push({ path: name, sha256: hash(readFileSync(target)) });
        }
    }
}
try {
    // Freeze web writes so the database and private attachments form one snapshot.
    docker(["exec", "-T", "app", "php", "artisan", "down", "--retry=30"]);
    mkdirSync(destination, { recursive: true });
    const dump = docker(
        [
            "exec",
            "-T",
            "database",
            "pg_dump",
            "-U",
            "roomfix",
            "-d",
            database,
            "--format=custom",
            "--no-owner",
            "--no-acl",
        ],
        true,
    );
    writeFileSync(join(destination, "database.dump"), dump);
    copyPhotos(join(root, "storage", "app", "private", "ticket-photos"));
    writeFileSync(
        join(destination, "manifest.json"),
        JSON.stringify(
            {
                version: 1,
                label,
                database,
                createdAt: new Date().toISOString(),
                sha256: hash(dump),
                files,
            },
            null,
            2,
        ) + "\n",
    );
    console.log(
        `Private data snapshot: ${destination}\nPhotos: ${files.length}\nKeep this folder private; it contains account and resident data.`,
    );
} finally {
    docker(["exec", "-T", "app", "php", "artisan", "up"]);
}

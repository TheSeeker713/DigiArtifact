import { execSync } from "node:child_process";

type SeedAdmin = {
  username: string;
  displayName: string;
  passwordEnv: string;
};

const ADMINS: SeedAdmin[] = [
  {
    username: "digi",
    displayName: "DigiArtifact",
    passwordEnv: "KAIA_ADMIN_DIGI_PASSWORD",
  },
  {
    username: "partner",
    displayName: "Partner",
    passwordEnv: "KAIA_ADMIN_PARTNER_PASSWORD",
  },
];

function toBase64Url(bytes: Uint8Array) {
  const base64 = Buffer.from(bytes).toString("base64");
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return {
    salt: toBase64Url(salt),
    hash: toBase64Url(new Uint8Array(bits)),
  };
}

function sqlEscape(value: string) {
  return value.replace(/'/g, "''");
}

function runWrangler(sql: string, remote: boolean) {
  const mode = remote ? "--remote" : "--local";
  const normalizedSql = sql.replace(/\s+/g, " ").trim().replace(/"/g, '\\"');
  const command = `npx wrangler d1 execute kaia-checklist ${mode} --command "${normalizedSql}"`;
  execSync(command, { stdio: "inherit" });
}

function readPasswordEnv(name: string) {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (value.length < 10 || value.length > 200) {
    throw new Error(`${name} must be between 10 and 200 characters.`);
  }
  return value;
}

async function main() {
  const remote = process.argv.includes("--remote");
  const local = process.argv.includes("--local");
  const useRemote = remote && !local;

  const schemaPath = "./migrations/002_admin_schedule.sql";
  const migrateCommand = useRemote
    ? `npx wrangler d1 execute kaia-checklist --remote --file=${schemaPath}`
    : `npx wrangler d1 execute kaia-checklist --local --file=${schemaPath}`;
  execSync(migrateCommand, { stdio: "inherit" });

  for (const admin of ADMINS) {
    const password = readPasswordEnv(admin.passwordEnv);
    const hashed = await hashPassword(password);
    const id = `admin_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
    runWrangler(
      `INSERT INTO admin_users (
         id, username, password_hash, password_salt, display_name, role, must_change_password, created_at
       ) VALUES (
         '${id}',
         '${admin.username}',
         '${hashed.hash}',
         '${hashed.salt}',
         '${sqlEscape(admin.displayName)}',
         'admin',
         1,
         datetime('now')
       )
       ON CONFLICT(username) DO UPDATE SET
         password_hash = excluded.password_hash,
         password_salt = excluded.password_salt,
         display_name = excluded.display_name,
         role = excluded.role,
         must_change_password = 1,
         password_updated_at = NULL`,
      useRemote
    );
  }

  process.stdout.write(`Seeded admin users (${useRemote ? "remote" : "local"}): digi, partner.\n`);
}

void main();

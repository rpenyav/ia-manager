import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import mysql from "mysql2/promise";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("Usage: node scripts/railway-migrate.mjs <sql-file> [sql-file...]");
  process.exit(1);
}

const host =
  process.env.DB_HOST ||
  process.env.MYSQLHOST ||
  process.env.RAILWAY_DB_HOST ||
  "trolley.proxy.rlwy.net";
const port = Number(
  process.env.DB_PORT || process.env.MYSQLPORT || process.env.RAILWAY_DB_PORT || 23705,
);
const user = process.env.DB_USER || process.env.MYSQLUSER || "root";
const database = process.env.DB_NAME || process.env.MYSQLDATABASE || "railway";
const password =
  process.env.MYSQL_PWD ||
  process.env.DB_PASSWORD ||
  process.env.MYSQLPASSWORD ||
  process.env.MYSQL_ROOT_PASSWORD ||
  "";

if (!password) {
  console.error(
    "Missing DB password. Set MYSQL_PWD or DB_PASSWORD before running this script.",
  );
  process.exit(1);
}

const sslMode = String(process.env.DB_SSL || process.env.MYSQL_SSL || "true").toLowerCase();
const tlsMin = process.env.MYSQL_TLS_MIN || "TLSv1.2";
const tlsMax = process.env.MYSQL_TLS_MAX || "";
const ssl =
  sslMode === "false" || sslMode === "0"
    ? undefined
    : {
        rejectUnauthorized: false,
        minVersion: tlsMin,
        ...(tlsMax ? { maxVersion: tlsMax } : {}),
      };

const connection = await mysql.createConnection({
  host,
  port,
  user,
  password,
  database,
  multipleStatements: true,
  connectTimeout: 30000,
  enableKeepAlive: true,
  ssl,
});

try {
  for (const file of files) {
    const filePath = path.resolve(file);
    const sql = fs.readFileSync(filePath, "utf8");
    if (!sql.trim()) {
      console.warn(`Skipping empty file: ${filePath}`);
      continue;
    }
    console.log(`Applying: ${filePath}`);
    await connection.query(sql);
    console.log(`OK: ${filePath}`);
  }
} finally {
  await connection.end();
}

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pool } from "../netlify/functions/lib/db.mjs";

try {
  const schemaPath = fileURLToPath(new URL("../database/init.sql", import.meta.url));
  const schema = await readFile(schemaPath, "utf8");
  await pool.query(schema);
  console.log("Esquema de base de datos instalado correctamente.");
} catch (error) {
  console.error("No se pudo inicializar la base de datos:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}

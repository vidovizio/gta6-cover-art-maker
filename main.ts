import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const root = fileURLToPath(new URL(".", import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

mkdirSync(output, { recursive: true });
cpSync(join(root, "app"), join(output, "app"), { recursive: true });
cpSync(join(root, "screenshots"), join(output, "screenshots"), { recursive: true });
writeFileSync(join(output, "dossier.json"), buildDossier(output, caps));

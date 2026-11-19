import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const destination = resolve(process.env.MAKEFUN_OUTPUT_DIR || "/output");

mkdirSync(destination, { recursive: true });
cpSync(join(projectRoot, "app"), join(destination, "app"), { recursive: true });
const screenshotSource = join(projectRoot, "screenshots");
if (existsSync(screenshotSource)) {
  cpSync(screenshotSource, join(destination, "screenshots"), { recursive: true });
} else {
  mkdirSync(join(destination, "screenshots"), { recursive: true });
}

const dossier = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(destination, "dossier.json"), dossier);

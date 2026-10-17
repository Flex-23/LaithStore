// Builds the app and packs everything the server needs into
// deploy/store-deploy.tar.gz (inside the project, git-ignored).
//
//   npm run pack          build + pack
//   npm run pack -- --skip-build   pack the existing .next only
//
// Never packed: node_modules, .env, public/uploads, .next/cache, .next/dev.
import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join("deploy", "store-deploy.tar.gz");
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: root, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(`\nFailed: ${cmd} ${args.join(" ")}`);
    process.exit(r.status ?? 1);
  }
};

if (!process.argv.includes("--skip-build")) {
  rmSync(join(root, ".next"), { recursive: true, force: true });
  run("npm", ["run", "build"]);
}

mkdirSync(join(root, "deploy"), { recursive: true });
rmSync(join(root, out), { force: true });

run("tar", [
  "-czf", out,
  "--exclude=.next/cache",
  "--exclude=.next/dev",
  "--exclude=.next/node_modules", // absolute symlinks; deploy/post-deploy.sh recreates them
  "--exclude=public/uploads",
  ".next",
  "public",
  "prisma",
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "postcss.config.mjs",
  "tsconfig.json",
  "deploy/post-deploy.sh",
]);

const mb = (statSync(join(root, out)).size / 1024 / 1024).toFixed(1);
console.log(`\nReady: ${out} (${mb} MB)`);
console.log("Upload it to ~/my-store/deploy/ on the server, then see deploy/README.md");

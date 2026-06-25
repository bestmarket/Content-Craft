import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import esbuildPluginPino from "esbuild-plugin-pino";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));

const banner = {
  js: `import { createRequire as __bannerCrReq } from 'node:module';
import __bannerPath from 'node:path';
import __bannerUrl from 'node:url';
globalThis.require = __bannerCrReq(import.meta.url);
globalThis.__filename = __bannerUrl.fileURLToPath(import.meta.url);
globalThis.__dirname = __bannerPath.dirname(globalThis.__filename);
`,
};

// Only exclude truly native binaries — everything else gets bundled
const external = [
  "*.node",
  "pg-native",
  "cpu-features",
  "bufferutil",
  "utf-8-validate",
  "dtrace-provider",
  "isolated-vm",
  "re2",
  "farmhash",
  "xxhash-addon",
  "ssh2",
  "hiredis",
  "kerberos",
  "snappy",
  "canvas",
  "bcrypt",
  "argon2",
  "fsevents",
];

await build({
  entryPoints: {
    handler: path.resolve(artifactDir, "src/vercel-handler.ts"),
  },
  platform: "node",
  bundle: true,
  format: "esm",
  outdir: path.resolve(artifactDir, "../../api"),
  outExtension: { ".js": ".mjs" },
  logLevel: "info",
  external,
  sourcemap: false,
  plugins: [esbuildPluginPino({ transports: [] })],
  banner,
});

console.log("✅ Vercel handler built → api/handler.mjs");

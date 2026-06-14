// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { execSync } from "child_process";

function getBuildInfo() {
  const envHash = process.env.VITE_GIT_HASH ?? process.env.GIT_HASH ?? process.env.CF_PAGES_COMMIT_SHA;
  const envCount = process.env.VITE_BUILD_NUMBER ?? process.env.BUILD_NUMBER;
  try {
    const hash = (envHash ?? execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim()).slice(0, 7);
    const count = envCount ?? execSync("git rev-list --count HEAD", { encoding: "utf-8" }).trim();
    return { hash, count: String(parseInt(count, 10) || 1).padStart(3, "0") };
  } catch {
    return { hash: envHash?.slice(0, 7) ?? "dev", count: (envCount ?? "001").padStart(3, "0") };
  }
}

const { hash, count } = getBuildInfo();
const buildDate = new Date().toISOString().split("T")[0];
const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "https://mpueyricnfkyobjaviph.supabase.co";
const supabasePublishableKey =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_bzztDx20ZpC_5MphnYLhng_aDlYFz_A";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify("2.0.1"),
      __GIT_HASH__: JSON.stringify(hash),
      __BUILD_DATE__: JSON.stringify(buildDate),
      __BUILD_NUMBER__: JSON.stringify(count),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
      "process.env.SUPABASE_URL": JSON.stringify(supabaseUrl),
      "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(supabasePublishableKey),
    },
    server: {
      hmr: {
        overlay: false,
      },
    },
  },
});

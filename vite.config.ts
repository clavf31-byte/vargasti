// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { execSync } from "child_process";

function getBuildInfo() {
  try {
    const hash = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
    const count = execSync("git rev-list --count HEAD", { encoding: "utf-8" }).trim();
    return { hash, count: String(parseInt(count, 10)).padStart(3, "0") };
  } catch {
    return { hash: "dev", count: "001" };
  }
}

const { hash, count } = getBuildInfo();
const buildDate = new Date().toISOString().split("T")[0];

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify("2.0.0"),
      __GIT_HASH__: JSON.stringify(hash),
      __BUILD_DATE__: JSON.stringify(buildDate),
      __BUILD_NUMBER__: JSON.stringify(count),
    },
  },
});

import { defineConfig } from "vitest/config";

// Plain Vite for tests: the Lovable/TanStack config adds SSR and dev plugins the engine doesn't need.
export default defineConfig({
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});

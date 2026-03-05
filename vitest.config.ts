import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [".local/**", "_plans/**", "node_modules/**"],
  },
});

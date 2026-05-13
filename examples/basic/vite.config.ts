import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      vibeset: path.resolve(__dirname, "../../src/index.ts"),
    },
  },
});

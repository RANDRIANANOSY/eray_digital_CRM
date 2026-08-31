import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import istanbul from "vite-plugin-istanbul";

export default defineConfig(({ command }) => ({
  base: command === "serve" ? "/" : "/app/",
  build: {
    outDir: "../back/public/app",
    emptyOutDir: true,
  },
  plugins: [
    viteReact(),
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    istanbul({
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: ["cypress/**", "node_modules/**"],
      extension: [".js", ".jsx", ".ts", ".tsx"],
      requireEnv: false,
      cypress: true,
    }),
  ],
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`,
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
}));

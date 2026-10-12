import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import istanbul from "vite-plugin-istanbul";

export default defineConfig(({ command }) => {
  const isProd = command === "build";
  // Istanbul instrumentation is only needed for Cypress coverage runs (which
  // start the dev server). Keeping it out of production builds avoids shipping
  // instrumentation code and speeds up the bundle.
  const enableCoverage = !isProd;

  return {
    base: command === "serve" ? "/" : "/app/",
    build: {
      outDir: "../back/public/app",
      emptyOutDir: true,
      // Broad evergreen browser support (Chrome/Edge 87+, Firefox 78+, Safari 14+).
      target: ["es2020", "chrome87", "edge88", "firefox78", "safari14"],
      cssTarget: ["chrome87", "safari14", "firefox78", "edge88"],
      sourcemap: false,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 600,
      reportCompressedSize: true,
    },
    plugins: [
      viteReact(),
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      ...(enableCoverage
        ? [
            istanbul({
              include: ["src/**/*.{js,jsx,ts,tsx}"],
              exclude: ["cypress/**", "node_modules/**"],
              extension: [".js", ".jsx", ".ts", ".tsx"],
              requireEnv: false,
              cypress: true,
            }),
          ]
        : []),
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
        "/uploads": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
        },
      },
    },
  };
});

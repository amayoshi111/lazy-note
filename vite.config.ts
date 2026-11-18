/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/lazy-note/" : "/",
  plugins: [
    react(),
    {
      name: "datasources-plugin",
      generateBundle() {
        // ビルド時に記事内の画像 (datasources/images) を dist にコピーする。
        // 記事の Markdown は import.meta.glob で JS チャンクとして配られるのでコピーしない
        const imagesPath = path.resolve("datasources", "images");
        const imagesOutputPath = path.resolve("dist", "datasources", "images");
        const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"];

        if (fs.existsSync(imagesPath)) {
          fs.mkdirSync(imagesOutputPath, { recursive: true });
          const imageFiles = fs.readdirSync(imagesPath);

          for (const file of imageFiles) {
            const ext = path.extname(file).toLowerCase();
            if (imageExtensions.includes(ext)) {
              const sourcePath = path.join(imagesPath, file);
              const destPath = path.join(imagesOutputPath, file);
              fs.copyFileSync(sourcePath, destPath);
            }
          }
        }
      },
    },
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    include: [
      "src/**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "scripts/**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    typecheck: {
      checker: "tsc",
      include: [
        "src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "scripts/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      ],
      tsconfig: "./tsconfig.test.json",
    },
  },
});

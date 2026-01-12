import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// https://vite.dev/config/
export default defineConfig({
  base: "/react-ai-chat-full-client-side/",
  plugins: [
    react(),
    visualizer({
      template: "treemap", // or sunburst
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: "analyse.html", // will be saved in project's root
    }),
  ],
  /* for multithreadthing wllama models */
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: "$prefix-cls: whub-ant;",
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // manualChunks removed to prevent potential loading order issues
      },
    },
  },
});

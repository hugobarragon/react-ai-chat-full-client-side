# React AI Chat (Full Client-Side)
This project runs a chatbot with LLM, entirely on the client-side with no server-side costs.

## Features
- **Dual Model Support:**
  - **Qwen 3 (WebLLM):** Runs on WebGPU for high-speed performance (requires compatible GPU).
  - **LFM 2.5 (Wllama/GGUF):** Runs on CPU via WebAssembly (works on any device).
- **Thinking Mode:** View the AI's "Thinking Process" to understand how it arrives at an answer.
- **Client-Side Only:** No API keys, no server costs. Everything runs in your browser.

## Model Hosting
The project automatically fetches models:
- **Qwen 3:** Fetched via WebLLM from MLC AI's huggingface CDN.
- **LFM 2.5:** Fetched as a GGUF from Hugging Face.

You can allow offline usage for LFM by placing the `LFM2.5-1.2B-Thinking-Q4_K_M.gguf` in `public/models/` and updating `src/services/wllama.ts`.

## Deployment & Warnings

### GitHub Pages & Multi-threading
To enable multi-threading (WASM) on GitHub Pages, we use `coi-serviceworker`. This is necessary because GitHub Pages does not support the required `Cross-Origin-Embedder-Policy` headers nativey.
- **Note:** `coi-serviceworker.min.js` MUST be served from the same origin (locally copied to `public/`), it cannot be loaded from a CDN.

### Common Warnings
- **"Multi-threads are not supported... falling back to single-thread"**: If seen on deployment, it means the service worker hasn't loaded (refresh the page). Locally, this shouldn't appear if proper headers are set.
- **"special_eos_id is not in special_eog_ids"**: A harmless warning about tokenizer metadata. We handle stop tokens manually (`<|im_end|>`).
- **"munmap failed: Invalid argument"**: A common WebAssembly teardown warning, safe to ignore.
- **"n_ctx_seq < n_ctx_train"**: Informational only; we limit context to 4096 tokens for browser performance (model supports 65k).

## React + TypeScript + Vite

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from "eslint-plugin-react";

export default tseslint.config({
  // Set the react version
  settings: { react: { version: "18.3" } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs["jsx-runtime"].rules,
  },
});
```

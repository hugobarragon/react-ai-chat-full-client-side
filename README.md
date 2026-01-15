# React AI Chat (Full Client-Side)
This project runs a chatbot with LLM, entirely on the client-side with no server-side costs.

## Features
- **Dual Model Support:**
  - **Qwen 3 (WebLLM):** Runs on WebGPU for high-speed performance (requires compatible GPU).
  - **EXAONE 4.0 (Wllama/GGUF):** Runs on CPU via WebAssembly (works on any device).
- **Thinking Mode:** View the AI's "Thinking Process" to understand how it arrives at an answer.
- **Client-Side Only:** No API keys, no server costs. Everything runs in your browser.

## Model Hosting
The project automatically fetches models:
- **Qwen 3:** Fetched via WebLLM from MLC AI's huggingface CDN.
- **EXAONE 4.0:** Fetched as a GGUF from Hugging Face.

You can allow offline usage for Exaone by placing the `EXAONE-4.0-1.2B-Q4_K_M.gguf` in `public/models/` and updating `src/services/wllama.ts`.

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

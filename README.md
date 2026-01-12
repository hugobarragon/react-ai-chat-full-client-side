# React AI Chat (Full Client-Side)

This project runs a chatbot with LLM, entirely on the client-side with no server-side costs.

## Model Hosting & GitHub Limits

Currently, this project is configured to fetch the GGUF model file (EXAONE 4.0 1.2B) from a remote URL (Hugging Face) during runtime.

You can host the model file locally within the frontend `public` folder for a completely offline experience. However, GitHub has a strict file size limit of 100MB per file. Since even lightweight LLM models (like the 1.2B parameter ones) are typically around 750MB+, we cannot store the model directly in this GitHub repository.

To run locally without internet:
1. Download the `EXAONE-4.0-1.2B-Q4_K_M.gguf` file.
2. Place it in the `public/models/` directory.
3. Update `src/services/wllama.ts` to point to `window.location.origin + "/models/EXAONE-4.0-1.2B-Q4_K_M.gguf"` instead of the remote URL.

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

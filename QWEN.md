# Qwen Code — Project Instructions

YOU CAN USE YARN AND NODE ONLY, NO CLI commands, if you want to read a file read it without using cli

## Project: react-ai-chat-full-client-side

Client-side only AI chat. Runs Qwen3.5 0.8B locally in-browser via WebGPU (WebLLM). Zero backend. Zero API keys. Model downloads once, cached in IndexedDB.

### Quick Start

```
yarn dev      → Vite dev (headers auto-set)
yarn build    → production build
yarn preview  → preview production
yarn lint     → ESLint
yarn deploy   → deploy to GitHub Pages (requires yarn build first)
```

### Deploy

```
yarn predeploy   → builds production bundle
yarn deploy      → pushes dist/ to gh-pages branch
```

GitHub Actions triggers automatically on `main` push. Alternatively run `yarn deploy` locally.

### Architecture (Tiny)

```
main.tsx → App.tsx (EngineProvider global state + useState nav)
   ├── LandingPage → capability detection (WebGPU, RAM, browser)
   └── QwenPage → Sidebar (static) + ChatArea (streaming + Sender)
                    └── useWebLLM hook (~250 LOC, core logic)
```

**No Redux, no Zustand, no react-router.** Just React context + custom hook + useState.

### Dependencies

| Package                  | Purpose                                             |
| ------------------------ | --------------------------------------------------- |
| `@mlc-ai/web-llm`        | In-browser ML inference engine (WebGPU)             |
| `antd` + `@ant-design/x` | UI components and markdown rendering                |
| `recharts`               | Charts (used in LandingPage diagnostics)            |
| `coi-serviceworker`      | Inject COOP/COEP headers client-side                |
| `axios`                  | HTTP requests (capability detection, external APIs) |

### Files That Matter (Read in Order)

1. `src/constants.ts` — **MODEL_ID, MODEL_CONFIG (FULL SPEC!), LAI_SETTINGS**
2. `src/systemPrompt.ts` — currently `system_prompt: ""` (empty)
3. `src/context/EngineContext.tsx` — global model download progress
4. `src/services/webllm.ts` — `initWebLLM()`, `chatWebLLM()`, `interruptWebLLM()`, `resetWebLLM()`
5. `src/hooks/useWebLLM.ts` — messaging, streaming (~16ms batches), context window
6. `src/components/ChatArea.tsx` — Bubble/XMarkdown messages, Sender input, Think panel
7. `src/components/Sidebar.tsx` — single static conversation item
8. `src/utils/deviceMemory.ts` — RAM → context window scaling (2048/4096/8192/16384)
9. `src/utils/browserChecks.ts` — WebGPU/device detection
10. `src/App.tsx` — root layout, menu, conditional rendering

### Critical Rules & Gotchas

1. **MODEL_CONFIG must be fully specified.** Any missing nested property in `constants.ts` causes silent defaults and likely runtime failure. Never rely on omitted properties.
2. **COOP/COEP headers are mandatory.** Without them → no SharedArrayBuffer → no WebGPU multi-threading → app breaks. Production requires both `public/coi-serviceworker.min.js` (client-side header injection) AND `public/serve.json` (server fallback).
3. **No react-router.** Navigation is `useState` in `App.tsx`. Adding it breaks the minimal architecture for a 2-page app.
4. **Single conversation only.** Sidebar is a hardcoded wrapper. Multi-conversation support doesn't exist.
5. **System prompt is empty.** Model has no persona. Populate `src/systemPrompt.ts` to change behavior.
6. **Model config URL must use GitHub raw or HuggingFace CDN.** Never use git clone URLs for model weights.

### WebLLM Data Flow

```
1. App loads → EngineProvider.preWarmModelCache() checks IndexedDB
    ├─ cached → status: complete (100%)
    └─ not cached → CreateMLCEngine() downloads model, on complete → engine.unload() (free GPU VRAM)
2. Chat starts → useWebLLM.initWebLLM() loads from disk to GPU (instant)
3. Message → handleRequest → chatWebLLM(stream: true) → token streaming (~16ms batches)
4. Stop → engine.interruptGenerate() | New chat → engine.resetChat() + clearMessages()
```

Pre-warm → unload GPU → lazy-load strategy: Downloads at boot, frees GPU, loads from disk at chat time. Feels instant on repeat visits.

### Inference Params (`LAI_SETTINGS` in constants.ts)

| Param             | Non-Thinking       | Thinking |
| ----------------- | ------------------ | -------- |
| temperature       | 0.7                | 1.0      |
| top_p             | 1.0                | 0.95     |
| presence_penalty  | 2.0                | 1.5      |
| frequency_penalty | 1.5                | 0.5      |
| min_p             | 0.1                | 0.2      |
| context_window    | device auto- (RAM) | device   |
| max_tokens        | 1024               | 1024     |

"Thinking mode" is enabled by default. Sender toggle turns it off. Sends `enable_thinking: true` in `extra_body` when on. Model wraps reasoning in `</think>`. ChatArea parses to render `<Think>` panel before response.

### Troubleshooting

| Problem                       | Cause                             | Fix                                                           |
| ----------------------------- | --------------------------------- | ------------------------------------------------------------- |
| "Model config incomplete"     | Missing nested props in config    | Add ALL nested properties explicitly                          |
| SharedArrayBuffer unavailable | Missing COIP/COEP headers         | Check `coi-serviceworker.min.js` loads + `serve.json` present |
| Chat input disabled           | Model failed to download/preload  | Check console, refresh page                                   |
| Slow inference                | Browser using integrated GPU      | Force browser to use dedicated GPU                            |
| GH Pages deploy fails         | GH Pages doesn't set COPI headers | Verify `coi-serviceworker.min.js` + `serve.json` in `public/` |

### Environment

- React 18 + TypeScript 5.6 (strict)
- Vite 6 (`base: /react-ai-chat-full-client-side/`)
- Ant Design 6 + `@ant-design/x` UI components
- SCSS global prefix: `$prefix-cls: whub-ant;`
- Deployment: `gh-pages` (subdirectory) via `gh-pages` package
- Build: `tsc -b && vite build` (combined ts + vite)

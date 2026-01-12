import { Wllama } from "@wllama/wllama";
import {
  chartToolDefinition,
  petStoreToolDefinition,
  executePetStoreRequest,
} from "../tools";

// Configuration for CDN loading
const CONFIG_PATHS = {
  "single-thread/wllama.wasm":
    "https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/single-thread/wllama.wasm",
  "multi-thread/wllama.wasm":
    "https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/multi-thread/wllama.wasm",
  "multi-thread/wllama.worker.mjs":
    "https://cdn.jsdelivr.net/npm/@wllama/wllama@2.3.7/esm/multi-thread/wllama.worker.mjs",
};

// Model URL - Remote GGUF from Hugging Face
const MODEL_URL =
  "https://huggingface.co/mradermacher/EXAONE-4.0-1.2B-Instruct-GGUF/resolve/main/EXAONE-4.0-1.2B-Instruct.Q4_K_M.gguf";

let wllama: Wllama | null = null;

export const initWllama = async () => {
  if (wllama) return wllama;

  console.log("Initializing Wllama...");

  wllama = new Wllama(CONFIG_PATHS, {
    logger: {
      debug: (...args) => console.debug("Wllama Debug:", ...args),
      log: (...args) => console.log("Wllama Log:", ...args),
      warn: (...args) => console.warn("Wllama Warn:", ...args),
      error: (...args) => console.error("Wllama Error:", ...args),
    },
  });

  return wllama;
};

export const stopExaone = async () => {
  if (wllama) {
    console.log("Stopping Wllama...");
    await wllama.exit();
    wllama = null;
  }
};

export const loadExaoneModel = async (onProgress?: (text: string) => void) => {
  const engine = await initWllama();

  if (await engine.isModelLoaded()) {
    return;
  }

  console.log("Downloading/Loading Exaone Model...");
  if (onProgress) onProgress("Initializing download...");

  const threads = navigator.hardwareConcurrency
    ? Math.max(1, navigator.hardwareConcurrency - 1)
    : undefined;
  console.log(`Using ${threads} threads`);

  await engine.loadModelFromUrl(MODEL_URL, {
    n_ctx: 2048, // Reduced context window to save memory and improve speed
    n_batch: 512, // Process tokens in larger batches during prefill
    n_threads: threads, // Use all available cores
    progressCallback: (opts) => {
      // Safe access to progress properties
      const loaded = (opts as any).loaded || 0;
      const total = (opts as any).total || 0;
      if (total > 0) {
        const progress = Math.round((loaded / total) * 100);
        if (onProgress) onProgress(`Downloading Exaone: ${progress}%`);
      }
    },
  });

  if (onProgress) onProgress("Model Loaded");
};

const decoder = new TextDecoder();

export const chatExaone = async (
  messageOrPrompt: string,
  onToken: (token: string) => void,
  onDebug?: (msg: string) => void,
  onStatus?: (status: string) => void,
  isRawPrompt = false
) => {
  console.log("Starting chatExaone...");
  onDebug?.("Initializing Wllama in chatExaone...");

  try {
    // Ensure model is loaded before chat
    await loadExaoneModel((msg) => {
      console.log("[Model Status]", msg);
      onDebug?.(`[Model Status] ${msg}`);
    });

    const engine = await initWllama();

    // EXAONE 4.0 Thinking Mode & Tool Use
    // Temperature >= 0.6 enables reasoning capabilities

    const formattedPrompt = isRawPrompt
      ? messageOrPrompt
      : `[|system|]
You are EXAONE, an AI assistant.
Respond to the user in English.
# Available Tools
You can use none, one, or multiple of the following tools by calling them as functions to help with the user’s query.
Here are the tools available to you in JSON format within <tool> and </tool> tags:
<tool>
${JSON.stringify(chartToolDefinition)}
</tool>
<tool>
${JSON.stringify(petStoreToolDefinition)}
</tool>

# Tool Usage Instructions
1. To use a tool, output a <tool_call> JSON object.
2. When you receive a tool result, analyze it.
3. If the user asked for a chart, use the 'generate_chart' tool with the data you received.
4. Do NOT output raw JSON data to the user.

For each function call you want to make, return a JSON object with function name and arguments within <tool_call> and </tool_call> tags, like:
<tool_call>{"name": "generate_chart", "arguments": {"type": "line", "title": "Sales", "data": [...], "xKey": "name", "yKey": "value"}}</tool_call>
[|endofturn|]
[|user|]
${messageOrPrompt}
[|endofturn|]
[|assistant|]
<think>
`;

    // Calculate prompt tokens for accurate prefill speed
    const promptTokens = await engine.tokenize(formattedPrompt);
    const promptTokenCount = promptTokens.length;

    const startTime = Date.now();
    let firstTokenTime = 0;
    let tokenCount = 0;
    let totalDecodeTime = 0;
    console.log("Prompt prepared, calling createCompletion...");
    onDebug?.("Prompt prepared. calling createCompletion...");

    let completion = (await engine.createCompletion(formattedPrompt, {
      nPredict: 1024, // Increased for thinking + response
      sampling: {
        temp: 0.7, // Thinking mode: temp >= 0.6
        top_k: 40,
        top_p: 0.95,
      },
      // @ts-ignore
      stop: ["[|user|]", "[|system|]"],
      onNewToken: (_token, piece, _currentText) => {
        try {
          if (firstTokenTime === 0) firstTokenTime = Date.now();
          tokenCount++;
          const text = decoder.decode(piece, { stream: true });
          console.log("Token received:", text);
          onDebug?.(`Token: ${JSON.stringify(text)}`);
          onToken(text);
        } catch (e) {
          console.error("Error decoding token", e);
        }
      },
    })) as string;

    // Calculate first pass decode time
    const endFirstPass = Date.now();
    if (firstTokenTime > 0) {
      totalDecodeTime += endFirstPass - firstTokenTime;
    }

    // Check for tool calls
    const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/;
    const match = completion.match(toolCallRegex);

    let toolResult = null;

    if (match) {
      try {
        const toolCall = JSON.parse(match[1]);
        if (toolCall.name === "petstore_request") {
          console.log("Executing Petstore Request:", toolCall.arguments);
          onDebug?.("Executing Petstore Request...");
          onStatus?.("⚙️ Executing Petstore Request...");

          toolResult = await executePetStoreRequest(toolCall.arguments);
          console.log("Petstore Result:", toolResult);
          onDebug?.("Petstore Result received.");
          onStatus?.("🧠 Analyzing tool data...");
        }
      } catch (e) {
        console.error("Error executing tool:", e);
        onDebug?.("Error executing tool: " + e);
      }
    }

    const prefillTime = firstTokenTime > 0 ? firstTokenTime - startTime : 0;
    // Avoid division by zero
    const prefillSpeed =
      prefillTime > 0 ? promptTokenCount / (prefillTime / 1000) : 0;
    const decodeSpeed =
      totalDecodeTime > 0 ? tokenCount / (totalDecodeTime / 1000) : 0;

    console.log("Completion finished");
    return {
      text: completion,
      toolResult,
      metrics: {
        prefillSpeed: prefillSpeed.toFixed(1),
        decodeSpeed: decodeSpeed.toFixed(1),
        timestamp: new Date().toLocaleString(),
      },
    };
  } catch (e) {
    console.error("Error in chatExaone:", e);
    throw e;
  }
};

export const getWllamaInstance = () => wllama;

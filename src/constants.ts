import { getModelConfigWithContext } from "./utils/deviceMemory";

// Shared model configuration for WebLLM
// Used by both src/context/EngineContext.tsx and src/services/webllm.ts

export const MODEL_ID = "Qwen3.5-0.8B-q4f16_1-MLC";

export const MODEL_CONFIG = getModelConfigWithContext({
  model: "https://huggingface.co/mlc-ai/Qwen3.5-0.8B-q4f16_1-MLC",
  model_id: "Qwen3.5-0.8B-q4f16_1-MLC",
  model_lib: "https://raw.githubusercontent.com/akaashrp/mlc-binaries/main/Qwen3.5-0.8B-q4f16_1-webgpu-mlc.wasm",
  overrides: {},
});

export const MODEL_CONFIG_LIST = [MODEL_CONFIG] as const;

// WebGPU compatibility message used as fallback text when
// the model fails to load because WebGPU isn't available.
export const WEBGPU_INCOMPATIBILITY_MESSAGE = "The AI model could not be loaded because this browser or device doesn't support WebGPU. Please use Chrome 113+, Edge 113+, or Safari 17+ on a supported device.";

export const RESPONSE_TRUNCATION_NOTIF_TITLE = "Response Truncated";
export const RESPONSE_TRUNCATION_NOTIF_MESSAGE = "The AI response was cut off because it hit its length limit. The response may be incomplete.";

export const INITIALIZATION_FAILED_NOTIF_TITLE = "Initialization Failed";

export const ERROR_NETWORK_NOTIF_TITLE = "Network Error";
export const ERROR_NETWORK_NOTIF_MESSAGE = "Failed to load model files. Please check your internet connection and try again.";

export const ERROR_MEMORY_NOTIF_TITLE = "Out of Memory";
export const ERROR_MEMORY_NOTIF_MESSAGE = "Your device doesn't have enough memory to run this model. Try closing other applications.";

export const CHAT_ERROR_NOTIF_TITLE = "Chat Error";

// LAI (Local AI) generation settings
export const LAI_SETTINGS = {
  nonThinking: {
    temperature: 1.0,
    top_p: 1.0,
    top_k: 20,
    min_p: 0.0,
    presence_penalty: 2.0,
    frequency_penalty: 0,
    repetition_penalty: 1.0,
  },
  thinking: {
    temperature: 1.0,
    top_p: 0.95,
    top_k: 20,
    min_p: 0.0,
    presence_penalty: 1.5,
    frequency_penalty: 0,
    repetition_penalty: 1.0,
  },
  context_window: 2048,
  max_tokens: 1024,
} as const;

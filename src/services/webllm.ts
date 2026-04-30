import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import systemPromptData from "../systemPrompt";
import { notification } from "antd";
import { LAI_SETTINGS, MODEL_ID, MODEL_CONFIG } from "../constants";

let engine: MLCEngine | null = null;

export const initWebLLM = async (
  onProgress?: (text: string) => void
): Promise<MLCEngine> => {
  if (engine) return engine;

  console.log("Initializing WebLLM...");
  console.log("Loading WebLLM model:", MODEL_ID);
  console.log("Model URL:", MODEL_CONFIG.model);
  console.log("Model WASM:", MODEL_CONFIG.model_lib);
  if (onProgress) onProgress("Initializing WebLLM Engine...");

  try {
    engine = await CreateMLCEngine(MODEL_ID, {
      appConfig: {
        model_list: [MODEL_CONFIG],
      },
      initProgressCallback: (report) => {
        console.log("WebLLM Progress:", report.text);
        if (onProgress) onProgress(report.text);
      },
      logLevel: "INFO",
    });

    return engine;
  } catch (e) {
    console.error("WebLLM Initialization Error:", e);

    if (e instanceof Error) {
      const errorMessage = e.message;

      if (errorMessage.includes("WebGPU") || errorMessage.includes("gpu")) {
        notification.error({
          title: "WebGPU Not Supported",
          description: "WebGPU is not available in your browser. Please use Chrome 113+, Edge 113+, or Safari 17+ on a supported device.",
          duration: 10,
        });
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        notification.error({
          title: "Network Error",
          description: "Failed to load model files. Please check your internet connection and try again.",
          duration: 10,
        });
      } else if (errorMessage.includes("memory") || errorMessage.includes("out of memory")) {
        notification.error({
          title: "Out of Memory",
          description: "Your device doesn't have enough memory to run this model. Try closing other applications.",
          duration: 10,
        });
      } else {
        notification.error({
          title: "Initialization Failed",
          description: errorMessage || "Failed to initialize WebLLM engine.",
          duration: 10,
        });
      }
    }

    throw e;
  }
};

export const chatWebLLM = async (
  messages: Array<{ role: string; content: string }>,
  onToken: (token: string) => void,
  onStatus?: (status: string) => void,
  enableThinking = false
) => {
  if (!engine) {
    await initWebLLM((text) => {
      onStatus?.(text);
    });
  }

  const activeEngine = engine;
  if (!activeEngine) {
    throw new Error("Engine initialization failed");
  }

  onStatus?.("Thinking...");

  const systemPrompt = systemPromptData.system_prompt;
  const normalizedMessages =
    messages.length > 0 && messages[0].role === "system"
      ? messages
      : [{ role: "system", content: systemPrompt }, ...messages];

  try {
    const settings = enableThinking ? LAI_SETTINGS.thinking : LAI_SETTINGS.nonThinking;
    const laiChatOptions = {
      messages: normalizedMessages as any,
      stream: true,
      ...settings,
      extra_body: {
        enable_thinking: enableThinking,
      },
    };

    const chunks = await activeEngine.chat.completions.create(laiChatOptions);

    let fullResponse = "";
    for await (const chunk of chunks as AsyncIterable<any>) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        onToken(content);
      }
    }

    const statsText = await activeEngine.runtimeStatsText();
    console.log("Runtime stats:", statsText);

    const prefillMatch = statsText.match(/prefill:\s*([\d.]+)\s*tokens?\/sec/i);
    const decodeMatch = statsText.match(/decod(?:ing|e):\s*([\d.]+)\s*tokens?\/sec/i);

    // Extract total tokens generated from fullResponse length (approximately 4 chars per token)
    // or try to extract from stats text
    let tokensUsed = Math.ceil(fullResponse.length / 4);

    // Extract generated token count from stats text
    const generatedMatch = statsText.match(/(\d+)\s*tokens\s*generated/i);
    if (generatedMatch && generatedMatch[1]) {
      const extracted = parseInt(generatedMatch[1], 10);
      if (!isNaN(extracted) && extracted > 0) {
        tokensUsed = extracted;
      }
    }

    const contextWindow = MODEL_CONFIG.overrides?.context_window_size || LAI_SETTINGS.context_window;

    // Round speeds to 1 decimal place
    const prefillSpeed = prefillMatch ? parseFloat(prefillMatch[1]).toFixed(1) : "N/A";
    const decodeSpeed = decodeMatch ? parseFloat(decodeMatch[1]).toFixed(1) : "N/A";

    return {
      text: fullResponse,
      metrics: {
        timestamp: new Date().toLocaleString(),
        prefillSpeed,
        decodeSpeed,
        tokensUsed,
        contextWindow,
      },
    };
  } catch (e) {
    console.error("WebLLM Chat Error:", e);

    // Show notification for different error types
    if (e instanceof Error) {
      const errorMessage = e.message;

      if (errorMessage.includes("max_tokens")) {
        notification.warning({
          title: "Response Truncated",
          description: "The AI response was cut off due to the max_tokens limit. The response may be incomplete.",
          duration: 5,
        });
      } else if (errorMessage.includes("WebGPU") || errorMessage.includes("gpu")) {
        notification.error({
          title: "WebGPU Error",
          description: "WebGPU is not supported or enabled in your browser. Please check your browser and system requirements.",
          duration: 8,
        });
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        notification.error({
          title: "Network Error",
          description: "Failed to load model files. Please check your internet connection and try again.",
          duration: 8,
        });
      } else if (errorMessage.includes("memory") || errorMessage.includes("out of memory")) {
        notification.error({
          title: "Out of Memory",
          description: "Your device doesn't have enough memory to run this model. Try closing other applications.",
          duration: 8,
        });
      } else {
        notification.error({
          title: "Chat Error",
          description: errorMessage || "An unexpected error occurred during chat generation.",
          duration: 5,
        });
      }
    }

    throw e;
  }
};

export const interruptWebLLM = async () => {
  if (engine) {
    await engine.interruptGenerate();
  }
};

export const resetWebLLM = async () => {
  if (engine) {
    await engine.resetChat();
  }
};

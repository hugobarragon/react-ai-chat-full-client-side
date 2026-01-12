import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import {
  chartToolDefinition,
  petStoreToolDefinition,
  executePetStoreRequest,
} from "../tools";

// Using built-in Qwen3-0.6B-q4f16_1-MLC configuration
const MODEL_ID = "Qwen3-0.6B-q4f16_1-MLC";

let engine: MLCEngine | null = null;

export const initWebLLM = async (
  onProgress?: (text: string) => void
): Promise<MLCEngine> => {
  if (engine) return engine;

  console.log("Initializing WebLLM...");
  if (onProgress) onProgress("Initializing WebLLM Engine...");

  engine = await CreateMLCEngine(MODEL_ID, {
    initProgressCallback: (report) => {
      console.log("WebLLM Progress:", report.text);
      if (onProgress) onProgress(report.text);
    },
    logLevel: "INFO",
  });

  return engine;
};

export const chatWebLLM = async (
  messageOrPrompt: string,
  onToken: (token: string) => void,
  onStatus?: (status: string) => void,
  isRawPrompt = false
) => {
  if (!engine) {
    throw new Error("Engine not initialized");
  }

  onStatus?.("Thinking...");

  const systemPrompt = `You are Gemma, a helpful AI assistant.

# Tools

You may call one or more functions to assist with the user query.

You are provided with function signatures within <tools></tools> XML tags:
<tools>
${JSON.stringify(chartToolDefinition)}
${JSON.stringify(petStoreToolDefinition)}
</tools>

For each function call, return a json object with function name and arguments within <tool_call></tool_call> XML tags:
<tool_call>
{"name": <function-name>, "arguments": <args-json-object>}
</tool_call>

# Tool Use Strategy
1. **Identify Intent**: Does the user want a chart or information about the Pet Store?
2. **Check Data**: Do you have the real data from the API to answer or plot?
3. **Action**:
    - If YES: Proceed with \`generate_chart\` or your answer.
    - If NO: You **MUST** first call \`petstore_request\` to fetch the data. **Do not** invent or hallucinate data.
4. **After Tool Output**: Once you receive the data from the tool, THEN you can generate the chart or provide the answer.

/think
`;

  const messages = isRawPrompt
    ? [{ role: "user", content: messageOrPrompt }]
    : [
        { role: "system", content: systemPrompt },
        { role: "user", content: messageOrPrompt },
      ];

  try {
    const chunks = await engine.chat.completions.create({
      messages: messages as any,
      stream: true,
      temperature: 0.7,
    });

    let fullResponse = "";
    for await (const chunk of chunks) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        onToken(content);
      }
    }

    // Check for tool calls
    const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/;
    const match = fullResponse.match(toolCallRegex);

    let toolResult = null;

    if (match) {
      try {
        const toolCall = JSON.parse(match[1]);
        if (toolCall.name === "petstore_request") {
          console.log("Executing Petstore Request:", toolCall.arguments);
          onStatus?.("⚙️ Executing Petstore Request...");

          toolResult = await executePetStoreRequest(toolCall.arguments);
          console.log("Petstore Result:", toolResult);
          onStatus?.("🧠 Analyzing tool data...");
        }
      } catch (e) {
        console.error("Error executing tool:", e);
      }
    }

    // Get runtime stats
    const statsText = await engine.runtimeStatsText();
    const prefillMatch = statsText.match(/prefill:\s*([\d.]+)\s*tok\/s/);
    const decodeMatch = statsText.match(/decode:\s*([\d.]+)\s*tok\/s/);

    return {
      text: fullResponse,
      toolResult,
      metrics: {
        timestamp: new Date().toLocaleString(),
        prefillSpeed: prefillMatch ? prefillMatch[1] : "N/A",
        decodeSpeed: decodeMatch ? decodeMatch[1] : "N/A",
      },
    };
  } catch (e) {
    console.error("WebLLM Chat Error:", e);
    throw e;
  }
};

export const interruptWebLLM = async () => {
  if (engine) {
    await engine.interruptGenerate();
  }
};

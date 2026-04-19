import { useState, useEffect, useRef } from "react";
import { initWebLLM, chatWebLLM, interruptWebLLM } from "../services/webllm";
import systemPromptData from "../systemPrompt";

export const useWebLLM = (initialMessages: any[] = []) => {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [loadingModel, setLoadingModel] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const load = async () => {
      try {
        await initWebLLM((progress) => {
          setLoadingProgress(progress);
        });
        setLoadingModel(false);
        setLoadingProgress("Model Loaded! Ready to chat.");
      } catch (err) {
        console.error("Failed to load WebLLM model", err);
        setLoadingProgress("Failed to load model.");
      }
    };
    load();
  }, []);

  const handleStop = async () => {
    await interruptWebLLM();
    setMessages((prev) => {
      const lastMsg = prev[prev.length - 1];
      if (
        lastMsg &&
        lastMsg.message.role === "ai" &&
        (lastMsg.status === "loading" || lastMsg.status === "typing")
      ) {
        return prev.map((m, idx) =>
          idx === prev.length - 1
            ? {
              ...m,
              status: "success",
              message: {
                ...m.message,
                content: m.message.content + " [Stopped]",
              },
              timestamp: new Date().toLocaleString(undefined, {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            }
            : m
        );
      }
      return prev;
    });
  };

  const handleRequest = async (content: string, enableThinking = false) => {
    const userMsg = {
      id: Date.now(),
      message: { role: "user", content },
      status: "success",
      timestamp: new Date().toLocaleString(),
    };
    const aiMsgId = Date.now() + 1;
    const aiMsg = {
      id: aiMsgId,
      message: { role: "ai", content: "" },
      status: "loading",
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);

    try {
      let tokenBuffer = "";
      let lastUpdateTime = Date.now();
      const BATCH_INTERVAL_MS = 16;

      const requestMessages = [
        { role: "system", content: systemPromptData.system_prompt },
        ...messages
          .filter((m) => m.message?.role && m.message?.content)
          .map((m) => ({
            role:
              m.message.role === "ai"
                ? "assistant"
                : m.message.role === "assistant"
                ? "assistant"
                : m.message.role === "user"
                ? "user"
                : "user",
            content: m.message.content,
          })),
        { role: "user", content },
      ];

      const result = await chatWebLLM(
        requestMessages,
        (currentText) => {
          tokenBuffer += currentText;
          const now = Date.now();

          if (now - lastUpdateTime >= BATCH_INTERVAL_MS) {
            const textToAdd = tokenBuffer;
            tokenBuffer = "";
            lastUpdateTime = now;

            setMessages((prev) => {
              return prev.map((m) =>
                m.id === aiMsgId
                  ? {
                    ...m,
                    message: {
                      ...m.message,
                      content: m.message.content + textToAdd,
                    },
                    status: "typing",
                    toolStatus: undefined,
                  }
                  : m
              );
            });
          }
        },
        (status) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? {
                  ...m,
                  toolStatus: status,
                }
                : m
            )
          );
        },
        enableThinking
      );

      // Flush remaining tokens
      if (tokenBuffer) {
        const textToAdd = tokenBuffer;
        setMessages((prev) => {
          return prev.map((m) =>
            m.id === aiMsgId
              ? {
                ...m,
                message: {
                  ...m.message,
                  content: m.message.content + textToAdd,
                },
                status: "typing",
              }
              : m
          );
        });
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
              ...m,
              status: "success",
              metrics: result.metrics,
              timestamp: new Date().toLocaleString(undefined, {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            }
            : m
        )
      );
    } catch (err) {
      console.error("Chat error", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? {
              ...m,
              message: {
                ...m.message,
                content: "Error during generation.",
              },
              status: "error",
              timestamp: new Date().toLocaleString(undefined, {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            }
            : m
        )
      );
    }
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    loadingModel,
    loadingProgress,
    handleRequest,
    handleStop,
    clearMessages,
  };
};

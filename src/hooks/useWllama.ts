import { useState, useEffect, useRef } from "react";
import { loadExaoneModel, chatExaone, stopExaone } from "../services/wllama";

export const useWllama = (initialMessages: any[] = []) => {
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [loadingModel, setLoadingModel] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState("");
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const load = async () => {
      try {
        await loadExaoneModel((progress) => {
          setLoadingProgress(progress);
        });
        setLoadingModel(false);
        setLoadingProgress("Model Loaded! Ready to chat.");
      } catch (err) {
        console.error("Failed to load Wllama model", err);
        setLoadingProgress("Failed to load model.");
      }
    };
    load();
  }, []);

  const handleRequest = async (content: string) => {
    // 1. Add User Message & AI Placeholder atomically
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
      timestamp: new Date().toLocaleString(),
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);

    try {
      // Token batching for faster display
      let tokenBuffer = "";
      let lastUpdateTime = Date.now();
      const BATCH_INTERVAL_MS = 16; // Update UI every 16ms (~60fps) for very fast streaming

      const result = await chatExaone(
        content,
        (currentText) => {
          tokenBuffer += currentText;
          const now = Date.now();

          // Flush buffer if enough time has passed
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
                    toolStatus: undefined, // Clear tool status when typing resumes
                  }
                  : m
              );
            });
          }
        },
        undefined, // onDebug
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
        }
      );

      // Flush any remaining tokens in the buffer
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
            ? { ...m, status: "success", metrics: result.metrics }
            : m
        )
      );

      // Handle Tool Result as new User Message
      if (result.toolResult) {
        const toolOutputMsg = `[System: Tool Output]\n${JSON.stringify(
          result.toolResult
        )}\n\nPlease use this data to answer the user's request: "${content}"`;

        // Trigger new request with tool output
        // Use setTimeout to ensure state updates settle and to mimic a new turn
        setTimeout(() => {
          handleRequest(toolOutputMsg);
        }, 100);
      }
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
            }
            : m
        )
      );
    }
  };

  const handleStop = async () => {
    await stopExaone();
    setMessages((prev) => {
      // Find the last message (which should be the AI one loading/typing) and mark it as stopped/error
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
            }
            : m
        );
      }
      return prev;
    });
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return {
    messages,
    setMessages,
    loadingModel,
    loadingProgress,
    handleRequest,
    handleStop,
    clearMessages,
  };
};

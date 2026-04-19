import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { CreateMLCEngine, hasModelInCache } from "@mlc-ai/web-llm";
import { MODEL_CONFIG } from "../constants";

export type DownloadStatus = "idle" | "loading" | "downloading" | "complete" | "error";

interface EngineContextType {
  status: DownloadStatus;
  progress: string;
  progressPercent: number;
  modelDownloaded: boolean;
}

const EngineContext = createContext<EngineContextType | null>(null);

export const useEngine = (): EngineContextType => {
  const context = useContext(EngineContext);
  if (!context) {
    throw new Error("useEngine must be used within an EngineProvider");
  }
  return context;
};

export const EngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [modelDownloaded, setModelDownloaded] = useState(false);
  const downloaded = useRef(false);

  const preWarmModelCache = useCallback(async () => {
    const modelId = MODEL_CONFIG.model_id;

    // Check if already fully cached
    const isCached = await hasModelInCache(modelId, { model_list: [MODEL_CONFIG] });
    if (isCached) {
      setStatus("complete");
      setProgressPercent(100);
      setProgress("Model files already cached");
      setModelDownloaded(true);
      return;
    }

    if (downloaded.current) return;
    downloaded.current = true;

    setStatus("loading");
    setProgress("Requesting model files...");
    setProgressPercent(0);

    try {
      // CreateMLCEngine downloads model weights to browser cache during initialization.
      // We use initProgressCallback to track download progress, then unload the GPU
      // to free memory while keeping model files cached on disk for later use.
      const engine = await CreateMLCEngine(modelId, {
        appConfig: {
          model_list: [MODEL_CONFIG],
        },
        initProgressCallback: (report) => {
          setProgress(report.text);

          const percentMatch = report.text.match(/(\d+)\s*%/);
          if (percentMatch) {
            const percent = parseInt(percentMatch[1], 10);
            setProgressPercent(percent);
            setStatus(percent >= 99 ? "complete" : "downloading");
          }

          const lower = report.text.toLowerCase();
          if (lower.includes("loading") || lower.includes("initializing")) {
            setStatus("loading");
          }
        },
      });

      setModelDownloaded(true);
      setStatus("complete");
      setProgressPercent(100);
      setProgress("Model files cached — GPU freed");

      // Unload the GPU — model files stay cached on disk for instant load later
      await engine.unload();
      setProgress("Model files cached — GPU freed");
    } catch (err: any) {
      setStatus("error");
      setProgress(err.message || "Download failed");
      console.error("WebLLM Download Error:", err);
    }
  }, []);

  useEffect(() => {
    preWarmModelCache();
  }, [preWarmModelCache]);

  return (
    <EngineContext.Provider
      value={{ status, progress, progressPercent, modelDownloaded }}
    >
      {children}
    </EngineContext.Provider>
  );
};
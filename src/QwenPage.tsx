import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { useWebLLM } from "./hooks/useWebLLM";

const QwenPage: React.FC = () => {
  const [activeKey, setActiveKey] = useState("0");
  const [conversationItems] = useState([
    { key: "0", label: "Qwen 3 (WebLLM)", group: "Today" },
  ]);
  const [restrictionsEnabled, setRestrictionsEnabled] = useState(false);

  const { messages, handleRequest, handleStop, loadingModel, loadingProgress, clearMessages } =
    useWebLLM([], restrictionsEnabled);

  const handleNewChat = async () => {
    // Clear the current messages
    clearMessages();

    // Optionally reset the engine session
    const { resetWebLLM } = await import("./services/webllm");
    await resetWebLLM();

    // Create a new conversation item
    // const newKey = Date.now().toString();
    // For now, we reuse the same item or just reset. 
    // Setting a new key allows the Sidebar to show a new item if we were managing list.
    // But since list is static, we just reset. 
    // If user wants history *list*, we need to update conversationItems.
    // Let's at least visually indicate a reset.
  };

  return (
    <div style={{ display: "flex", height: "100%", width: "100%" }}>
      <Sidebar
        items={conversationItems}
        activeKey={activeKey}
        onActiveChange={setActiveKey}
        onNewChat={handleNewChat}
      />
      <ChatArea
        messages={messages}
        onSendMessage={handleRequest}
        onCancel={handleStop}
        loadingModel={loadingModel}
        loadingProgress={loadingProgress}
        welcomeTitle="Hello, I'm Qwen 3"
        welcomeDescription="I run on your GPU via WebLLM! (Fast)"
        onToggleRestrictions={() => setRestrictionsEnabled(!restrictionsEnabled)}
        restrictionsEnabled={restrictionsEnabled}
      />
    </div>
  );
};

export default QwenPage;

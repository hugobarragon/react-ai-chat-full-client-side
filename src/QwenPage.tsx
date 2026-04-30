import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { useWebLLM } from "./hooks/useWebLLM";
import { resetWebLLM } from "./services/webllm";

const QwenPage: React.FC = () => {
  const [activeKey, setActiveKey] = useState("0");
  const [conversationItems] = useState([
    { key: "0", label: "LAI (WebLLM)", group: "Today" },
  ]);

  const {
    messages,
    handleRequest,
    handleStop,
    loadingModel,
    loadingProgress,
    clearMessages,
  } = useWebLLM([]);

  const handleNewChat = async () => {
    // Clear the current messages
    clearMessages();

    // Reset the WebLLM chat session
    await resetWebLLM();
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
        welcomeTitle="Hello, I'm LAI"
        welcomeDescription=""
      />
    </div>
  );
};

export default QwenPage;

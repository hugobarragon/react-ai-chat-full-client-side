import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { useWllama } from "./hooks/useWllama";

const ExaonePage: React.FC = () => {
  const [activeKey, setActiveKey] = useState("0");
  const [conversationItems] = useState([
    { key: "0", label: "Exaone Model", group: "Today" },
  ]);

  const { messages, handleRequest, handleStop, loadingModel, loadingProgress, clearMessages } =
    useWllama([]);

  const handleNewChat = () => {
    clearMessages();
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
        welcomeTitle="Hello, I'm EXAONE 4.0"
        welcomeDescription="I run on your CPU via Wllama! (Optimized for Logic)"
      />
    </div>
  );
};

export default ExaonePage;

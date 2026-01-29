import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { useWllama } from "./hooks/useWllama";

const LfmPage: React.FC = () => {
  const [activeKey, setActiveKey] = useState("0");
  const [conversationItems] = useState([
    { key: "0", label: "LFM Reasoning", group: "Today" },
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
        welcomeTitle="Hello, I'm LFM 2.5 Reasoning"
        welcomeDescription="I run on your CPU via Wllama! (1.2B Thinking Model)"
      />
    </div>
  );
};

export default LfmPage;

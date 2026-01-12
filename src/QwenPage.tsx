import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { useWebLLM } from "./hooks/useWebLLM";

const QwenPage: React.FC = () => {
  const [activeKey, setActiveKey] = useState("0");
  const [conversationItems] = useState([
    { key: "0", label: "Qwen 3 (WebLLM)", group: "Today" },
  ]);

  const { messages, handleRequest, handleStop, loadingModel, loadingProgress } =
    useWebLLM([]);

  return (
    <div style={{ display: "flex", height: "100%", width: "100%" }}>
      <Sidebar
        items={conversationItems}
        activeKey={activeKey}
        onActiveChange={setActiveKey}
        onNewChat={() => {}}
      />
      <ChatArea
        messages={messages}
        onSendMessage={handleRequest}
        onCancel={handleStop}
        loadingModel={loadingModel}
        loadingProgress={loadingProgress}
      />
    </div>
  );
};

export default QwenPage;

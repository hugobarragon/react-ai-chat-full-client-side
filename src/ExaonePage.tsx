import React, { useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { useWllama } from "./hooks/useWllama";

const ExaonePage: React.FC = () => {
  const [activeKey, setActiveKey] = useState("0");
  const [conversationItems] = useState([
    { key: "0", label: "Exaone Model", group: "Today" },
  ]);

  const { messages, handleRequest, handleStop, loadingModel, loadingProgress } =
    useWllama([]);

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

export default ExaonePage;

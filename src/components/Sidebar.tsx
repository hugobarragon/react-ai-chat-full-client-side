import React from "react";
import { Conversations } from "@ant-design/x";
import { theme } from "antd";

interface SidebarProps {
  items: any[];
  activeKey: string;
  onActiveChange: (key: string) => void;
  onNewChat: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  items,
  activeKey,
  onActiveChange,
  onNewChat,
}) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        width: 250,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: token.colorBgLayout,
      }}
    >
      <div
        style={{
          padding: "16px",
          fontWeight: "bold",
          fontSize: "18px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span>AI Assistant</span>
      </div>
      <Conversations
        items={items}
        activeKey={activeKey}
        onActiveChange={onActiveChange}
        groupable
        creation={{
          onClick: onNewChat,
        }}
      />
    </div>
  );
};

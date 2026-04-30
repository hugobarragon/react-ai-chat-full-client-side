import React, { useRef, useEffect, useState } from "react";
import { Bubble, Sender, Welcome, Prompts, Think } from "@ant-design/x";
import XMarkdown from "@ant-design/x-markdown";
import {
  Flex,
  Avatar,
  Alert,
  GetProp,
  Typography,
  Button,
  Progress,
} from "antd";
import {
  UserOutlined,
  RobotOutlined,
  FireOutlined,
  LoadingOutlined,
  BulbOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import { LAI_SETTINGS } from "../constants";

interface ChatAreaProps {
  messages: any[];
  loadingModel: boolean;
  loadingProgress: string;
  onSendMessage: (content: string, enableThinking: boolean) => void;
  onCancel: () => void;
  welcomeTitle?: string;
  welcomeDescription?: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  loadingModel,
  loadingProgress,
  onSendMessage,
  onCancel,
  welcomeTitle = "Hello, I'm your AI Assistant",
  welcomeDescription = "I'm ready to help you!",
}) => {
  const [value, setValue] = useState("");
  const [thinkingEnabled, setThinkingEnabled] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const items: GetProp<typeof Prompts, "items"> = [
    {
      key: "1",
      icon: <BulbOutlined style={{ color: "#faad14" }} />,
      label: "Explain Concept",
      description: "Explain the theory of relativity in simple terms.",
    },
    {
      key: "2",
      icon: <ToolOutlined style={{ color: "#1890ff" }} />,
      label: "Write Code",
      description: "Write a JavaScript function to filter an array of objects.",
    },
    {
      key: "3",
      icon: <FireOutlined style={{ color: "#ff4d4f" }} />,
      label: "Creative Task",
      description: "Write a haiku about artificial intelligence.",
    },
  ];

  const isGenerating = messages.some(
    (m) => m.status === "loading" || m.status === "typing",
  );

  return (
    <div
      style={{
        padding: "24px",
        paddingTop: "20px",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          marginBottom: "16px",
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Chat
        </Typography.Title>
      </div>

      {loadingModel && (
        <Alert
          title="Loading AI Model"
          description={loadingProgress}
          type="info"
          showIcon
          icon={<LoadingOutlined />}
          style={{ marginBottom: 20 }}
        />
      )}

      <Flex
        vertical
        gap="middle"
        style={{ flex: 1, overflowY: "auto", paddingBottom: "20px" }}
      >
        {messages.length === 0 && !loadingModel && (
          <Welcome
            variant="borderless"
            title={welcomeTitle}
            description={welcomeDescription}
            extra={
              <Prompts
                title="Do you want to?"
                items={items}
                onItemClick={(info) =>
                  onSendMessage(
                    info.data.description as string,
                    thinkingEnabled,
                  )
                }
              />
            }
          />
        )}

        {messages.map((msg) => {
          const isAi = msg.message.role === "ai";

          // Extract thinking content for AI messages
          const [aiThinkingContent, nonTinkingresponse] =
            msg.message.role === "ai" && msg.message.content
              ? msg.message.content.split("</think>\n")
              : [];

          const isThinking =
            msg.message.content.includes("<think>\n") &&
            !msg.message.content.includes("</think>\n");

          return (
            <div key={msg.id} style={{ width: "100%" }}>
              <Bubble
                placement={msg.message.role === "user" ? "end" : "start"}
                loading={msg.status === "loading" && msg.message.role !== "ai"}
                avatar={
                  <Avatar
                    icon={
                      msg.message.role === "ai" ? (
                        <RobotOutlined />
                      ) : (
                        <UserOutlined />
                      )
                    }
                  />
                }
                content={
                  <div>
                    {thinkingEnabled && isAi ? (
                      <Think
                        blink
                        loading={isThinking}
                        defaultExpanded={false}
                        title="Thinking process"
                        style={{ marginBottom: "8px" }}
                      >
                        <XMarkdown>{aiThinkingContent}</XMarkdown>
                      </Think>
                    ) : null}
                    <XMarkdown>
                      {msg.message.role === "ai"
                        ? nonTinkingresponse
                        : msg.message.content}
                    </XMarkdown>
                    {msg.timestamp && (
                      <div
                        style={{
                          fontSize: "10px",
                          color: "#999",
                          marginTop: "4px",
                          textAlign: "right",
                        }}
                      >
                        <div>{msg.timestamp}</div>
                        {msg.message.role === "ai" && msg.metrics && (
                          <div
                            style={{
                              marginTop: "4px",
                              fontSize: "9px",
                              color: "#aaa",
                            }}
                          >
                            Prefill: {msg.metrics.prefillSpeed} tok/s | Decode:{" "}
                            {msg.metrics.decodeSpeed} tok/s
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </Flex>

      <div style={{ marginTop: "auto" }}>
        {(() => {
          const lastMessage = messages[messages.length - 1];
          const tokensUsed = lastMessage?.metrics?.tokensUsed || 0;
          const contextWindow =
            lastMessage?.metrics?.contextWindow || LAI_SETTINGS.context_window;
          const percent =
            contextWindow > 0
              ? Math.round((tokensUsed / contextWindow) * 100)
              : 0;
          const strokeColor = percent >= 80 ? "#faad14" : "#1890ff";

          return (
            <Sender
              value={value}
              onChange={setValue}
              footer={
                <Flex gap="small" align="center">
                  <Button
                    variant="outlined"
                    color={thinkingEnabled ? "primary" : "default"}
                    onClick={() => setThinkingEnabled((checked) => !checked)}
                  >
                    <span style={{ color: "#555" }}>Thinking mode</span>
                  </Button>
                  <Progress
                    type="circle"
                    size={14}
                    percent={percent}
                    strokeColor={strokeColor}
                    format={() => `${tokensUsed}/${contextWindow}`}
                  />
                </Flex>
              }
              onSubmit={(v) => {
                if (isGenerating) return;
                setValue("");
                onSendMessage(v, thinkingEnabled);
              }}
              onCancel={onCancel}
              loading={isGenerating}
              disabled={loadingModel} // Fixed: Do not disable on isGenerating to allow stop
              placeholder={
                loadingModel
                  ? "Waiting for model to load..."
                  : isGenerating
                    ? "Waiting for response..."
                    : "Type a message..."
              }
            />
          );
        })()}
      </div>
    </div>
  );
};

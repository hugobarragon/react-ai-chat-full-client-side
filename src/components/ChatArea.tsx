import React, { useRef, useEffect, useState } from "react";
import { Bubble, Sender, Welcome, Prompts, Think } from "@ant-design/x";
import XMarkdown from "@ant-design/x-markdown";
import { Flex, Avatar, Alert, GetProp, Typography, Button, Space, Tooltip } from "antd";
import {
  UserOutlined,
  RobotOutlined,
  FireOutlined,
  LoadingOutlined,
  BulbOutlined,
  ToolOutlined,
} from "@ant-design/icons";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

// Utility function to parse thinking content and charts from AI messages
const parseMessageContent = (content: string) => {
  let thinking = "";
  let response = content;
  let chartData = null;
  let hasThinking = false;

  // 1. Parse Thinking
  // Support both <think>...</think> and /think ...
  const closingThinkTag = "</think>";
  const closingThinkIndex = content.indexOf(closingThinkTag);
  const slashThinkTag = "/think";
  const slashThinkIndex = content.indexOf(slashThinkTag);

  if (closingThinkIndex !== -1) {
    let thinkingContent = content.substring(0, closingThinkIndex).trim();
    thinkingContent = thinkingContent.replace(/^<think>\s*/i, "");
    thinking = thinkingContent;
    response = content
      .substring(closingThinkIndex + closingThinkTag.length)
      .trim();
    hasThinking = true;
  } else if (slashThinkIndex !== -1) {
    let thinkingContent = content
      .substring(slashThinkIndex + slashThinkTag.length)
      .trim();
    thinking = thinkingContent;
    response = ""; // If everything is thinking
    hasThinking = true;
  }

  // 2. Parse Tool Calls (Charts)
  // Format: <tool_call>{"name": "generate_chart", "arguments": {...}}</tool_call>
  const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/;
  const toolMatch = response.match(toolCallRegex);

  if (toolMatch) {
    try {
      const toolCall = JSON.parse(toolMatch[1].trim());
      if (toolCall.name === "generate_chart" && toolCall.arguments) {
        chartData = toolCall.arguments;
      }
      // Remove the tool call tag from the text response
      response = response.replace(toolCallRegex, "").trim();
    } catch (e) {
      console.error("Failed to parse tool call JSON", e);
    }
  }

  return { thinking, response, hasThinking, chartData };
};

interface ChatAreaProps {
  messages: any[];
  loadingModel: boolean;
  loadingProgress: string;
  onSendMessage: (content: string) => void;
  onCancel: () => void;
  welcomeTitle?: string;
  welcomeDescription?: string;
  onToggleRestrictions?: () => void;
  restrictionsEnabled?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  loadingModel,
  loadingProgress,
  onSendMessage,
  onCancel,
  welcomeTitle = "Hello, I'm your AI Assistant",
  welcomeDescription = "I'm ready to help you!",
  onToggleRestrictions,
  restrictionsEnabled = false,
}) => {
  const [value, setValue] = useState("");
  const [thinkingEnabled, setThinkingEnabled] = useState(true);

  // ... (existing refs/useEffect) ...

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
      icon: <FireOutlined style={{ color: "#ff4d4f" }} />,
      label: "Hot Topics",
      description: "What are our trending technologies?",
    },
  ];

  const isGenerating = messages.some(
    (m) => m.status === "loading" || m.status === "typing"
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
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <Typography.Title level={4} style={{ margin: 0 }}>
          Chat
        </Typography.Title>
        <Space>
          {onToggleRestrictions && (
            <Tooltip title="When enabled, the AI uses the Pet Store example API and Chart generation tools.">
              <Button
                type={restrictionsEnabled ? "primary" : "default"}
                icon={<ToolOutlined />}
                onClick={onToggleRestrictions}
              >
                Restrictions: {restrictionsEnabled ? "ON" : "OFF"}
              </Button>
            </Tooltip>
          )}
          <Button
            type={thinkingEnabled ? "primary" : "default"}
            icon={<BulbOutlined />}
            onClick={() => setThinkingEnabled(!thinkingEnabled)}
          >
            Thinking: {thinkingEnabled ? "ON" : "OFF"}
          </Button>
        </Space>
      </div>

      <Alert
        title="English Only Mode"
        description="This agent is optimized for English to reduce hallucinations. Please interact in English for best results."
        type="warning"
        showIcon
        style={{ marginBottom: 20 }}
      />

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
                  onSendMessage(info.data.description as string)
                }
              />
            }
          />
        )}

        {messages.map((msg) => {
          // Parse thinking content for AI messages
          const isAI = msg.message.role === "ai";
          const parsed = isAI ? parseMessageContent(msg.message.content) : null;

          // Always show collapse for AI messages if Thinking is Enabled
          let showThinking = false;
          let thinkingContent = "";
          let showResponse = false;

          if (isAI && thinkingEnabled) {
            if (parsed && parsed.thinking) {
              showThinking = true;
              thinkingContent = parsed.thinking;
            }
            // If we have parsed thinking, check if we have response
            if (parsed && parsed.response) {
              showResponse = true;
            } else if (msg.status === 'success' && parsed && !parsed.thinking) {
              // If success and no thinking, just response
              showResponse = true;
            } else if (!parsed?.thinking && (msg.status === 'loading' || msg.status === 'typing')) {
              // Streaming, potentially just thinking
              // If we detect <think> start but no end, it's thinking
              if (msg.message.content.includes("<think>")) {
                showThinking = true;
                thinkingContent = msg.message.content.replace(/^<think>/, "");
                showResponse = false;
              } else {
                // Normal content
                showResponse = true;
              }
            }

            // Fallback for partial thinking
            if (parsed && parsed.thinking) {
              showThinking = true;
              thinkingContent = parsed.thinking;
            }
            if (parsed && parsed.response) {
              showResponse = true;
            }
            if (!parsed?.thinking && !parsed?.response && msg.message.content) {
              // Raw content
              showResponse = true;
            }

          } else if (isAI && !thinkingEnabled) {
            if (parsed && parsed.response) {
              showResponse = true;
            } else if (!parsed?.thinking && msg.message.content) {
              showResponse = true;
            }
          }

          return (
            <div key={msg.id} style={{ width: "100%" }}>
              <Bubble
                placement={msg.message.role === "user" ? "end" : "start"}
                content={
                  isAI ? (
                    <div>
                      {/* Think for Thinking */}
                      {showThinking && thinkingEnabled && (
                        <Think
                          title="Thinking Process"
                          blink
                          loading={msg.status === "loading" && !showResponse}
                          defaultExpanded={false}
                        >
                          <XMarkdown>{thinkingContent}</XMarkdown>
                        </Think>
                      )}

                      {/* Show Response */}
                      {(showResponse || (!thinkingEnabled && isAI)) && (
                        <XMarkdown>
                          {parsed?.response || msg.message.content.replace(/<think>[\s\S]*?<\/think>/, "")}
                        </XMarkdown>
                      )}

                      {/* Chart Section */}
                      {parsed && parsed.chartData && (
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                          minHeight={250}
                          minWidth={250}
                        >
                          <LineChart data={parsed.chartData.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={parsed.chartData.xKey || "name"} />
                            <YAxis />
                            <RechartsTooltip />
                            <Legend />
                            <Line
                              type="monotone"
                              dataKey={parsed.chartData.yKey || "value"}
                              stroke="#8884d8"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}

                      {/* Tool Status Indicator and Live Speed */}
                      {(msg.status === "loading" || msg.status === "typing") && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#1890ff",
                            marginTop: "8px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <LoadingOutlined spin />
                          <span>{msg.toolStatus || "Generating..."}</span>
                          {/* Live speed if available */}
                          {msg.metrics && (
                            <>
                              <span style={{ marginLeft: 12 }}>
                                Prefill: {msg.metrics.prefillSpeed} tok/s
                              </span>
                              <span style={{ marginLeft: 8 }}>
                                Decode: {msg.metrics.decodeSpeed} tok/s
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <XMarkdown>{msg.message.content}</XMarkdown>
                      {msg.timestamp && (
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#999",
                            marginTop: "4px",
                            textAlign: "right",
                          }}
                        >
                          {msg.timestamp}
                        </div>
                      )}
                    </div>
                  )
                }
                loading={msg.status === "loading"}
                avatar={
                  msg.message.role === "ai" ? (
                    <Avatar icon={<RobotOutlined />} />
                  ) : (
                    <Avatar icon={<UserOutlined />} />
                  )
                }
              />
            </div>
          );
        })
        }
        <div ref={messagesEndRef} />
      </Flex>

      <div style={{ marginTop: "auto" }}>
        <Sender
          value={value}
          onChange={setValue}
          onSubmit={(v) => {
            if (isGenerating) return;
            setValue("");
            onSendMessage(v);
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
      </div>
    </div>
  );
};

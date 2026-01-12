import React, { useRef, useEffect, useState } from "react";
import { Bubble, Sender, Welcome, Prompts } from "@ant-design/x";
import XMarkdown from "@ant-design/x-markdown";
import { Flex, Avatar, Alert, GetProp, Collapse } from "antd";
import {
  UserOutlined,
  RobotOutlined,
  FireOutlined,
  LoadingOutlined,
  BulbOutlined,
} from "@ant-design/icons";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
    thinking = `\`<think>\`\n${thinkingContent}\n\`</think>\``;
    response = content
      .substring(closingThinkIndex + closingThinkTag.length)
      .trim();
    hasThinking = true;
  } else if (slashThinkIndex !== -1) {
    // Handle /think style
    // Assume /think starts the block. We need to find where it ends.
    // If there is no explicit end, we might assume the whole start is thinking?
    // Or maybe the user implies /think is just a marker.
    // Let's assume /think ... \n\n is the block or it continues until some other marker?
    // For now, let's treat everything after /think as thinking if it's at the start,
    // but usually there is an answer.
    // Let's try to split by double newline if possible, or just display it all as thinking if no clear separation.
    // Actually, usually /think is followed by text.
    // Let's just format it nicely.
    let thinkingContent = content
      .substring(slashThinkIndex + slashThinkTag.length)
      .trim();
    thinking = `\`${slashThinkTag}\`\n${thinkingContent}`;
    // If we can't separate response, we just show thinking.
    // But usually the model will output /think ... then the answer.
    // If the user provided specific docs, maybe there is a /endthink?
    // Without it, it's hard to separate.
    // Let's assume for now we just highlight it.
    response = ""; // If everything is thinking
    hasThinking = true;

    // Heuristic: if there is a "Here is the answer" or similar, split?
    // Or maybe the model outputs /think [reasoning] [answer]
    // Let's try to find a double newline after some text?
    // For safety, let's just display everything in the thinking block if we detect /think
    // and let the user see it.
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
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  loadingModel,
  loadingProgress,
  onSendMessage,
  onCancel,
}) => {
  const [value, setValue] = useState("");

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

  // --- NEW: Track thinking state for streaming ---
  /*
  const [thinkingOpenMap, setThinkingOpenMap] = useState(
    {} as Record<string, boolean>
  );
  useEffect(() => {
    const newMap: Record<string, boolean> = {};
    messages.forEach((msg) => {
      const isAI = msg.message.role === "ai";
      const parsed = isAI ? parseMessageContent(msg.message.content) : null;
      if (isAI && parsed && parsed.hasThinking) {
        newMap[msg.id] = msg.status === "loading";
      }
    });
    setThinkingOpenMap(newMap);
    // eslint-disable-next-line
  }, [messages]);
  */

  // --- Track thinking state for streaming ---
  /*
  const [thinkingDraft, setThinkingDraft] = useState(
    {} as Record<string, string>
  );
  useEffect(() => {
    // Track live thinking for each AI message
    const newDraft: Record<string, string> = {};
    messages.forEach((msg) => {
      const isAI = msg.message.role === "ai";
      if (isAI && msg.status === "loading") {
        // Show everything up to </think> or end
        const content = msg.message.content;
        const closingThinkTag = "</think>";
        const closingThinkIndex = content.indexOf(closingThinkTag);
        if (closingThinkIndex !== -1) {
          newDraft[msg.id] = content.substring(
            0,
            closingThinkIndex + closingThinkTag.length
          );
        } else {
          newDraft[msg.id] = content;
        }
      }
    });
    setThinkingDraft(newDraft);
  }, [messages]);
  */

  return (
    <div
      style={{
        padding: "24px",
        paddingTop: "60px", // Increased padding to prevent topbar from hiding alerts
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxWidth: "800px",
        margin: "0 auto",
        width: "100%",
        overflow: "hidden", // Prevent double scrollbars
      }}
    >
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
            icon="https://mdn.alipayobjects.com/huamei_iwk9zp/afts/img/A*s5sNRo5LjfQAAAAAAAAAAAAADgCCAQ/original"
            title="Hello, I'm your AI Assistant"
            description="I'm running EXAONE 4.0 (1.2B) - Optimized for RAG & Logic!"
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

          // Always show collapse for AI messages
          let showCollapse = false;
          let thinkingContent = "";
          let showResponse = false;
          // let collapseActiveKey = [];
          if (isAI) {
            const content = msg.message.content;
            const closingThinkTag = "</think>";
            const closingThinkIndex = content.indexOf(closingThinkTag);
            if (
              msg.status === "loading" ||
              (closingThinkIndex === -1 && msg.status !== "success")
            ) {
              // While streaming or no </think> yet, show all content in collapse
              showCollapse = true;
              thinkingContent = content;
              showResponse = false;
              collapseActiveKey = ["thinking"];
            } else if (closingThinkIndex !== -1 && msg.status === "success") {
              // When </think> appears and finished, show collapse closed, show response
              showCollapse = true;
              thinkingContent = content.substring(
                0,
                closingThinkIndex + closingThinkTag.length
              );
              showResponse = true;
              collapseActiveKey = [];
            }
          }

          // Debug logging
          if (isAI && parsed) {
            console.log("🔍 AI Message Content:", msg.message.content);
            console.log("🧠 Parsed Thinking:", parsed.thinking);
            console.log("💬 Parsed Response:", parsed.response);
            console.log("✅ Has Thinking:", parsed.hasThinking);
            console.log("📊 Has Chart:", !!parsed.chartData);
          }

          return (
            <div key={msg.id} style={{ width: "100%" }}>
              <Bubble
                placement={msg.message.role === "user" ? "end" : "start"}
                content={
                  isAI ? (
                    <div>
                      {/* Always show Thinking Section - Collapsible */}
                      {showCollapse && (
                        <Collapse
                          size="small"
                          items={[
                            {
                              key: "thinking",
                              label: (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    color: "#1890ff",
                                  }}
                                >
                                  <BulbOutlined />
                                  <span>Thinking Process</span>
                                </div>
                              ),
                              children: (
                                <div
                                  style={{
                                    fontSize: "13px",
                                    color: "#666",
                                    fontStyle: "italic",
                                  }}
                                >
                                  <XMarkdown>{thinkingContent}</XMarkdown>
                                </div>
                              ),
                            },
                          ]}
                          style={{
                            marginBottom: "12px",
                            background: "rgba(24, 144, 255, 0.05)",
                            borderColor: "rgba(24, 144, 255, 0.2)",
                            borderRadius: "8px",
                          }}
                          // Remove controlled activeKey so user can open/close
                        />
                      )}
                      {/* After thinking ends, show response outside collapse */}
                      {showResponse && (
                        <>
                          <XMarkdown>
                            {msg.message.content.substring(
                              msg.message.content.indexOf("</think>") + 8
                            )}
                          </XMarkdown>
                        </>
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
                            <Tooltip />
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
                      {msg.status === "loading" && (
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
                          <span>{msg.toolStatus || "Thinking..."}</span>
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
        })}
        <div ref={messagesEndRef} />
      </Flex>

      <div style={{ marginTop: "auto" }}>
        <Sender
          value={value}
          onChange={setValue}
          onSubmit={(v) => {
            setValue("");
            onSendMessage(v);
          }}
          onCancel={onCancel}
          loading={messages.some((m) => m.status === "loading")}
          disabled={loadingModel}
          placeholder={
            loadingModel ? "Waiting for model to load..." : "Type a message..."
          }
        />
      </div>
    </div>
  );
};

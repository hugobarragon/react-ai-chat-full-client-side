import React from "react";
import { Typography, Button, Space } from "antd";
import { RobotOutlined, RocketOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

interface LandingPageProps {
  onNavigate: (key: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "40px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
      }}
    >
      <RocketOutlined style={{ fontSize: "80px", marginBottom: "30px" }} />

      <Title level={1} style={{ color: "white", marginBottom: "10px" }}>
        Browser AI Chat
      </Title>

      <Paragraph
        style={{
          fontSize: "18px",
          color: "rgba(255, 255, 255, 0.9)",
          maxWidth: "600px",
          textAlign: "center",
          marginBottom: "40px",
        }}
      >
        Experience the power of local AI with <strong>EXAONE 4.0</strong> and{" "}
        <strong>Qwen 3</strong> - cutting-edge language models running entirely
        in your browser using WebGPU and WebAssembly.
      </Paragraph>

      <Space size="large">
        <Button
          type="primary"
          size="large"
          icon={<RobotOutlined />}
          onClick={() => onNavigate("exaone")}
          style={{
            height: "50px",
            fontSize: "16px",
            background: "white",
            color: "#667eea",
            border: "none",
          }}
        >
          Start Chatting
        </Button>
      </Space>
    </div>
  );
};

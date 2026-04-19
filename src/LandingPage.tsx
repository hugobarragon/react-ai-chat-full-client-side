import React, { useState, useEffect } from "react";
import { Typography, Button, Space, Card, Tag, Spin, Descriptions, Collapse, Row, Col } from "antd";
import {
  RobotOutlined,
  RocketOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  DesktopOutlined,
  GlobalOutlined,
  DatabaseOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { detectAllFeatures, FeatureCheckResult } from "./utils/browserChecks";

const { Title, Paragraph, Text } = Typography;

interface LandingPageProps {
  onNavigate: (key: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  supported: '#52c41a',
  unsupported: '#ff4d4f',
  partial: '#faad14',
  info: '#1890ff',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  supported: <CheckCircleOutlined />,
  unsupported: <CloseCircleOutlined />,
  partial: <WarningOutlined />,
  info: <InfoCircleOutlined />,
};

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [checks, setChecks] = useState<FeatureCheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runChecks = async () => {
      try {
        const result = await detectAllFeatures();
        setChecks(result);
      } catch (err) {
        console.error('Feature detection failed:', err);
      } finally {
        setLoading(false);
      }
    };
    runChecks();
  }, []);

  if (loading) {
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
        <Spin size="large" />
        <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: "16px", fontSize: "16px" }}>
          Detecting browser capabilities...
        </Text>
      </div>
    );
  }

  const readiness = checks?.webllmReadiness;
  const webgpu = checks?.webgpu as any;
  const browser = checks?.browser;
  const device = checks?.device;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 20px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        minHeight: "100%",
        overflow: "auto",
      }}
    >
      {/* Hero Section */}
      <div style={{ maxWidth: "800px", textAlign: "center", marginBottom: "40px" }}>
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
          Experience the power of local AI with <strong>Qwen 3.5 0.8B</strong> -
          a cutting-edge model running in your browser using WebGPU.
        </Paragraph>
        <Space size="large">
          <Button
            type="primary"
            size="large"
            icon={<RobotOutlined />}
            onClick={() => onNavigate("qwen")}
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

      {/* WebLLM Readiness Banner */}
      {readiness && (
        <Card
          style={{
            maxWidth: "800px",
            width: "100%",
            marginBottom: "24px",
            background: readiness.ready
              ? "rgba(82, 196, 26, 0.1)"
              : "rgba(255, 77, 79, 0.1)",
            border: `1px solid ${readiness.ready ? "#52c41a" : "#ff4d4f"}`,
          }}
          styles={{ body: { padding: "20px" } }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {readiness.ready ? (
              <CheckCircleOutlined style={{ fontSize: "32px", color: "#52c41a" }} />
            ) : (
              <CloseCircleOutlined style={{ fontSize: "32px", color: "#ff4d4f" }} />
            )}
            <div style={{ flex: 1 }}>
              <Title level={4} style={{ color: readiness.ready ? "#52c41a" : "#ff4d4f", marginBottom: "8px" }}>
                WebLLM Readiness: {readiness.ready ? "Ready" : "Not Ready"}
              </Title>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <Text style={{ color: "rgba(255,255,255,0.7)" }}>Score:</Text>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: "4px", height: "8px" }}>
                  <div
                    style={{
                      width: `${readiness.score}%`,
                      height: "100%",
                      background: readiness.ready ? "#52c41a" : "#ff4d4f",
                      borderRadius: "4px",
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
                <Text style={{ color: "rgba(255,255,255,0.7)" }}>{readiness.score}/100</Text>
              </div>
              {readiness.issues.length > 0 && (
                <div style={{ marginBottom: "8px" }}>
                  {readiness.issues.map((issue, i) => (
                    <Tag key={i} color="red" style={{ margin: "2px" }}>
                      <CloseCircleOutlined /> {issue}
                    </Tag>
                  ))}
                </div>
              )}
              {readiness.recommendations.length > 0 && (
                <div>
                  {readiness.recommendations.map((rec, i) => (
                    <Tag key={i} color="blue" style={{ margin: "2px" }}>
                      <InfoCircleOutlined /> {rec}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Feature Checklist Grid */}
      <div style={{ maxWidth: "800px", width: "100%" }}>
        <Title level={3} style={{ color: "white", textAlign: "center", marginBottom: "24px" }}>
          <GlobalOutlined /> Browser & GPU Compatibility Check
        </Title>

        <Row gutter={[16, 16]}>
          {/* WebGPU Card */}
          <Col xs={24} md={12}>
            <Card
              style={{
                background: "rgba(255,255,255,0.1)",
                border: `1px solid ${STATUS_COLORS[webgpu?.available && webgpu?.enabled ? 'supported' : 'unsupported']}`,
              }}
              styles={{ body: { padding: "16px" } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <ThunderboltOutlined style={{ fontSize: "24px", color: STATUS_COLORS[webgpu?.available && webgpu?.enabled ? 'supported' : 'unsupported'] }} />
                <Title level={5} style={{ color: "white", marginBottom: 0 }}>WebGPU</Title>
                <Tag color={STATUS_COLORS[webgpu?.available && webgpu?.enabled ? 'supported' : 'unsupported']}>
                  {STATUS_ICONS[webgpu?.available && webgpu?.enabled ? 'supported' : 'unsupported']}
                  {webgpu?.available && webgpu?.enabled ? "Supported" : "Unsupported"}
                </Tag>
              </div>
              {webgpu?.available && webgpu?.enabled && webgpu?.computeTier !== null && (
                <Descriptions size="small" column={1} styles={{ label: { color: "rgba(255,255,255,0.6)" } }} style={{ marginBottom: "8px" }}>
                  <Descriptions.Item label="Compute Tier">Tier {webgpu.computeTier}</Descriptions.Item>
                  <Descriptions.Item label="GPU">{webgpu.info?.renderer || "Unknown"}</Descriptions.Item>
                  <Descriptions.Item label="Vendor">{webgpu.info?.vendor || "Unknown"}</Descriptions.Item>
                </Descriptions>
              )}
              {!webgpu?.available && (
                <Text style={{ color: "rgba(255,255,255,0.6)" }}>
                  WebGPU is not available in your browser. Use Chrome 113+, Edge 113+, or Safari 17+.
                </Text>
              )}
            </Card>
          </Col>

          {/* Browser Card */}
          <Col xs={24} md={12}>
            <Card
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              styles={{ body: { padding: "16px" } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <GlobalOutlined style={{ fontSize: "24px", color: "#1890ff" }} />
                <Title level={5} style={{ color: "white", marginBottom: 0 }}>Browser</Title>
              </div>
              <Descriptions size="small" column={1} styles={{ label: { color: "rgba(255,255,255,0.6)" } }} style={{ marginBottom: "8px" }}>
                <Descriptions.Item label="Name">{browser?.name}</Descriptions.Item>
                <Descriptions.Item label="Version">{browser?.version}</Descriptions.Item>
                <Descriptions.Item label="Platform">{browser?.platform}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Device Memory Card */}
          <Col xs={24} md={12}>
            <Card
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              styles={{ body: { padding: "16px" } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <DatabaseOutlined style={{ fontSize: "24px", color: "#722ed1" }} />
                <Title level={5} style={{ color: "white", marginBottom: 0 }}>Device Memory</Title>
              </div>
              <Descriptions size="small" column={1} styles={{ label: { color: "rgba(255,255,255,0.6)" } }} style={{ marginBottom: "8px" }}>
                <Descriptions.Item label="RAM">{device?.deviceMemory ? `${device.deviceMemory} GB` : "Unknown"}</Descriptions.Item>
                <Descriptions.Item label="CPU Cores">{device?.hardwareConcurrency} cores</Descriptions.Item>
                <Descriptions.Item label="Screen">{device?.screenResolution} @ {device?.pixelRatio}x</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Texture Compression Card */}
          <Col xs={24} md={12}>
            <Card
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
              styles={{ body: { padding: "16px" } }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <DesktopOutlined style={{ fontSize: "24px", color: "#13c2c2" }} />
                <Title level={5} style={{ color: "white", marginBottom: 0 }}>Texture Compression</Title>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {checks?.textureCompression && Object.entries(checks.textureCompression).map(([format, supported]) => (
                  <Tag
                    key={format}
                    color={supported ? "green" : "default"}
                    style={{ margin: 0, fontSize: "11px" }}
                  >
                    {format.toUpperCase()}
                  </Tag>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Detailed Checks */}
        <Card
          style={{
            maxWidth: "800px",
            width: "100%",
            marginTop: "24px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
          styles={{ body: { padding: "20px" } }}
        >
          <Title level={5} style={{ color: "white", marginBottom: "16px" }}>
            <DesktopOutlined /> Detailed Feature Checks
          </Title>
          <Collapse
            ghost
            style={{ background: "transparent" }}
            items={checks?.checks.map((check) => ({
              key: check.label,
              label: (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Text style={{ color: STATUS_COLORS[check.status], fontSize: "16px" }}>
                    {STATUS_ICONS[check.status]}
                  </Text>
                  <Text style={{ color: "white", fontWeight: 500 }}>{check.label}</Text>
                  <Tag color={STATUS_COLORS[check.status]} style={{ marginLeft: "auto" }}>
                    {check.value}
                  </Tag>
                </div>
              ),
              children: (
                <Text style={{ color: "rgba(255,255,255,0.7)" }}>
                  {check.description}
                </Text>
              ),
            })) || []}
          />
        </Card>

        {/* Requirements Section */}
        <Card
          style={{
            maxWidth: "800px",
            width: "100%",
            marginTop: "24px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
          }}
          styles={{ body: { padding: "20px" } }}
        >
          <Title level={5} style={{ color: "white", marginBottom: "16px" }}>
            <SafetyOutlined /> Requirements for Running LLMs in Browser
          </Title>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
            {[
              { icon: "🌐", text: "Chrome 113+, Edge 113+, or Safari 17+" },
              { icon: "⚡", text: "WebGPU enabled in browser" },
              { icon: "💾", text: "At least 4GB RAM (8GB recommended)" },
              { icon: "🖥️", text: "Dedicated GPU (integrated works for small models)" },
              { icon: "🔒", text: "HTTPS or localhost (for COOP/COEP)" },
              { icon: "📡", text: "Internet connection (for model download)" },
            ].map((req, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>{req.icon}</span>
                <Text style={{ color: "rgba(255,255,255,0.8)" }}>{req.text}</Text>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

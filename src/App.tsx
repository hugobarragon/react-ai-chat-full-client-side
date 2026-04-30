import { useState } from "react";
import { Layout, Menu, theme } from "antd";
import { HomeOutlined, BulbOutlined } from "@ant-design/icons";
import QwenPage from "./QwenPage";
import { LandingPage } from "./LandingPage";
import { EngineProvider } from "./context/EngineContext";
import { ModelDownloadStatus } from "./components/ModelDownloadStatus";

const { Header, Content } = Layout;

const AppContent = () => {
  const [current, setCurrent] = useState("home");
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const items = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: "Home",
    },
    {
      key: "qwen",
      icon: <BulbOutlined style={{ color: "orange" }} />,
      label: "LAI (WebLLM - GPU)",
    },
  ];

  return (
    <Layout style={{ height: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          background: colorBgContainer,
          padding: "0 20px",
          position: "sticky",
          top: 0,
          zIndex: 1,
        }}
      >
        <div
          className="demo-logo"
          style={{ marginRight: "20px", fontWeight: "bold", fontSize: "18px" }}
        >
          Browser AI Chat
        </div>
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[current]}
          items={items}
          onClick={(e) => setCurrent(e.key)}
          style={{ flex: 1, minWidth: 0, borderBottom: "none" }}
        />
        <ModelDownloadStatus />
      </Header>
      <Content style={{ height: "calc(100vh - 64px)", overflow: "auto" }}>
        {current === "home" && <LandingPage onNavigate={setCurrent} />}
        {current === "qwen" && <QwenPage />}
      </Content>
    </Layout>
  );
};

function App() {
  return (
    <EngineProvider>
      <AppContent />
    </EngineProvider>
  );
}

export default App;

import { useState } from "react";
import { Layout, Menu, theme } from "antd";
import { RobotOutlined, HomeOutlined, BulbOutlined } from "@ant-design/icons";
import ExaonePage from "./ExaonePage";
import QwenPage from "./QwenPage";
import { LandingPage } from "./LandingPage";

const { Header, Content } = Layout;

function App() {
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
      key: "exaone",
      icon: <RobotOutlined style={{ color: "purple" }} />,
      label: "Exaone (GGUF)",
    },
    {
      key: "qwen",
      icon: <BulbOutlined style={{ color: "orange" }} />,
      label: "Qwen 3 (WebLLM)",
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
          defaultSelectedKeys={["home"]}
          selectedKeys={[current]}
          items={items}
          onClick={(e) => setCurrent(e.key)}
          style={{ flex: 1, minWidth: 0, borderBottom: "none" }}
        />
      </Header>
      <Content style={{ height: "calc(100vh - 64px)", overflow: "auto" }}>
        {current === "home" && <LandingPage onNavigate={setCurrent} />}
        {current === "exaone" && <ExaonePage />}
        {current === "qwen" && <QwenPage />}
      </Content>
    </Layout>
  );
}

export default App;

import React from "react";
import { Progress, Tooltip } from "antd";
import { useEngine, DownloadStatus } from "../context/EngineContext";

const statusConfig: Record<
  DownloadStatus,
  { color: string; bgColor: string; borderColor: string; display?: string }
> = {
  idle: { color: "#8c8c8c", bgColor: "#f5f5f5", borderColor: "#d9d9d9" },
  loading: { color: "#faad14", bgColor: "#fffbe6", borderColor: "#fadb14" },
  downloading: { color: "#1890ff", bgColor: "#e6f7ff", borderColor: "#91d5ff" },
  complete: { color: "#52c41a", bgColor: "#f6ffed", borderColor: "#b7eb8f" },
  error: { color: "#ff4d4f", bgColor: "#fff2f0", borderColor: "#ffa39e" },
};

const iconMap: Record<DownloadStatus, string> = {
  idle: "",
  loading: "⏳",
  downloading: "📥",
  complete: "✅",
  error: "❌",
};

export const ModelDownloadStatus: React.FC = () => {
  const { status, progressPercent, progress } = useEngine();
  const config = statusConfig[status];
  const icon = iconMap[status];

  if (status === "idle") return null;

  return (
    <Tooltip title={progress} placement="bottom">
      <div
        style={{
          marginLeft: "12px",
          height: 50,
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "3px 10px",
          borderRadius: "16px",
          background: config.bgColor,
          border: `1px solid ${config.borderColor}`,
          cursor: "default",
          whiteSpace: "nowrap",
        }}
      >
        {icon && (
          <span style={{ fontSize: "13px", lineHeight: 1 }}>{icon}</span>
        )}
        <span
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: config.color,
            minWidth: "36px",
            textAlign: "center",
          }}
        >
          {progressPercent}%
        </span>
        {(status === "loading" || status === "downloading") && (
          <Progress
            type="circle"
            size={16}
            percent={progressPercent}
            strokeColor={config.color}
            railColor={config.bgColor}
            showInfo={false}
          />
        )}
      </div>
    </Tooltip>
  );
};

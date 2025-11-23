import { Handle, Position } from "@xyflow/react";
import styles from "./node.module.scss";
import { ChevronDown, User } from "lucide-react";
import { Button } from "antd";
import {  useState, useLayoutEffect, useRef } from "react";
import { UserNodeData } from "./nodeTypes";

interface UserNodeProps {
  data: UserNodeData;
}

const UserNode = ({ data }: UserNodeProps) => {
  const [isMore, setIsMore] = useState(false);
  const [showMore, setShowMore] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);
  const innerContentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (innerContentRef.current) {
      const height = innerContentRef.current.scrollHeight;
      setContentHeight(height);
      setIsMore(height > 100);
    }
  }, [data.message]);

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`${styles.customNode} ${styles.userNode}`}>
      {/* 节点头部 */}
      <div className={styles.nodeHeader}>
        <div className={styles.nodeTitle}>
          <User size={16} />
          <span>用户</span>
        </div>
        {data.timestamp && (
          <div className={styles.nodeTime}>{formatTime(data.timestamp)}</div>
        )}
      </div>

      <Handle type="target" position={Position.Top} />

      {/* 内容区域 */}
      <div className={styles.nodeContent}>
        {isMore && (
          <div
            className={`${showMore ? styles.hiddenTip : styles.showTip} ${
              styles.showMoreTip
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setShowMore((prev) => !prev);
            }}
          >
            {showMore ? "收起" : "展开"}......
          </div>
        )}

        <div
          className={`${styles.textWrapper} nowheel`}
          style={{
            height: showMore ? contentHeight : 0,
          }}
        >
          <div ref={innerContentRef} className={styles.textContent}>
            {data.message}
          </div>
        </div>
      </div>

      {/* 节点工具栏 */}
      <div className={styles.nodeTool}>
        {isMore && (
          <Button
            icon={
              <ChevronDown
                size={16}
                style={{
                  transform: showMore ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              />
            }
            className={styles.toolItem}
            onClick={(e) => {
              e.stopPropagation();
              setShowMore((prev) => !prev);
            }}
          />
        )}
      </div>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default UserNode;
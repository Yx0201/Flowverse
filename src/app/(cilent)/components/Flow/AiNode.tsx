import { Handle, Position } from "@xyflow/react";
import styles from "./node.module.scss";
import { ChevronDown, Bot, Loader2, Brain } from "lucide-react";
import { Button, Collapse } from "antd";
import { useState, useLayoutEffect, useRef, useEffect } from "react";
import { AiNodeData } from "./nodeTypes";

interface AiNodeProps {
  data: AiNodeData;
}

const AiNode = ({ data }: AiNodeProps) => {
  const [isMore, setIsMore] = useState(false);
  const [showMore, setShowMore] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);
  const [isCollapseOpen, setIsCollapseOpen] = useState(true); // 追踪折叠面板的打开状态
  const innerContentRef = useRef<HTMLDivElement>(null);
  const thinkingContentRef = useRef<HTMLDivElement>(null); // 思考过程内容的引用

  // 派生状态：不需要state，直接从props计算
  const isTyping = data.isStreaming && !data.isComplete;
  const displayedMessage = data.message;

  // 思考过程自动触底
  useEffect(() => {
    if (thinkingContentRef.current && data.isStreaming && isCollapseOpen) {
      // 在流式更新时，自动滚动到底部
      thinkingContentRef.current.scrollTop = thinkingContentRef.current.scrollHeight;
    }
  }, [data.thinking, data.isStreaming, isCollapseOpen]);

  // 计算内容高度并决定是否显示"展开更多"按钮
  useLayoutEffect(() => {
    if (innerContentRef.current) {
      const height = innerContentRef.current.scrollHeight;
      setContentHeight(height);
      setIsMore(height > 100);
    }
  }, [data.message]); // 直接依赖data.message而不是displayedMessage

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 处理折叠面板变化
  const handleCollapseChange = (keys: string | string[]) => {
    const isOpen = Array.isArray(keys) ? keys.includes('thinking') : keys === 'thinking';
    setIsCollapseOpen(isOpen);

    // 如果折叠面板被关闭，重置滚动位置到顶部
    if (!isOpen && thinkingContentRef.current) {
      thinkingContentRef.current.scrollTop = 0;
    }
  };

  return (
    <div className={`${styles.customNode} ${styles.aiNode}`}>
      {/* 节点头部 */}
      <div className={styles.nodeHeader}>
        <div className={styles.nodeTitle}>
          <Bot size={16} />
          <span>AI Assistant</span>
          {isTyping && (
            <Loader2
              size={14}
              className={styles.typingIndicator}
              style={{ animation: 'spin 1s linear infinite' }}
            />
          )}
        </div>
        {data.timestamp && (
          <div className={styles.nodeTime}>{formatTime(data.timestamp)}</div>
        )}
      </div>

      <Handle type="target" position={Position.Top} />

      {/* 内容区域 */}
      <div className={styles.nodeContent}>
        {/* 思考过程折叠区域 */}
        {data.thinking && (
          <div className={`${styles.thinkingSection}  nowheel`}>
            <Collapse
              ghost
              activeKey={isCollapseOpen ? ['thinking'] : []}
              onChange={handleCollapseChange}
              items={[
                {
                  key: 'thinking',
                  label: (
                    <div className={styles.thinkingHeader}>
                      <Brain size={16} />
                      <span>AI思考过程</span>
                    </div>
                  ),
                  children: (
                    <div
                      ref={thinkingContentRef}
                      className={styles.thinkingContent}
                    >
                      {data.thinking}
                      {data.isStreaming && !data.isComplete && (
                        <span className={styles.cursor}>|</span>
                      )}
                    </div>
                  ),
                },
              ]}
              size="small"
            />
          </div>
        )}

        {/* 正式回答区域 */}
        <div className={styles.answerSection}>
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
            className={`${styles.textWrapper} nowheel ${isTyping ? styles.typing : ''}`}
            style={{
              height: showMore ? contentHeight : 0,
            }}
          >
            <div ref={innerContentRef} className={styles.textContent}>
              {displayedMessage}
              {isTyping && (
                <span className={styles.cursor}>|</span>
              )}
            </div>
          </div>

          {/* 状态指示器 */}
          {!data.isComplete && data.isStreaming && (
            <div className={styles.streamingIndicator}>
              <span>正在生成回复...</span>
            </div>
          )}
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

export default AiNode;
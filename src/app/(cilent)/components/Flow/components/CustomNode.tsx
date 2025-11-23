"use client";
import { Handle, Position, NodeToolbar } from "@xyflow/react";
import { NodeProps } from "@xyflow/react";
import { useReactFlow } from "@xyflow/react";
import { useState } from "react";
import styles from "./customNode.module.scss";
import { ColorTool } from "./ColorTool";
import MarkdownRenderer from "./MarkdownRenderer";

// 定义节点数据类型
export interface CustomNodeData {
  label: string;
  description?: string;
  backgroundColor?: string;
  borderColor?: string;
  handleColor?: string;
  nodeType?: 'user' | 'ai' | 'system';
  isStreaming?: boolean;
  timestamp?: string;
  content?: string;
  thinking?: string; // AI思考过程
  [key: string]: unknown; // 支持其他自定义属性
}

const CustomNode = ({ data, selected, id }: NodeProps) => {
  const { updateNodeData, getNode, setCenter } = useReactFlow();
  const nodeData = data as CustomNodeData;

  // 跟踪交互状态
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null);

  // 处理颜色变化
  const handleColorChange = (nodeId: string, color: string) => {
    updateNodeData(nodeId, {
      backgroundColor: color,
      borderColor: color,
      handleColor: color,
    });
  };

  // 鼠标按下事件 - 记录起始位置
  const handleMouseDown = (e: React.MouseEvent) => {
    console.log("触发按下事件");
    setIsMouseDown(true);
    setIsDragging(false);
    setDragStartPosition({ x: e.clientX, y: e.clientY });
  };

  // 鼠标移动事件 - 检测拖拽
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMouseDown && dragStartPosition) {
      const deltaX = Math.abs(e.clientX - dragStartPosition.x);
      const deltaY = Math.abs(e.clientY - dragStartPosition.y);

      // 如果鼠标移动超过5像素，认为是拖拽
      if (deltaX > 5 || deltaY > 5) {
        setIsDragging(true);
      }
    }
  };

  // 鼠标抬起事件 - 判断是否为拖拽
  const handleMouseUp = () => {
    console.log("触发抬起事件");

    // 延迟重置状态，确保双击检测正常工作
    setTimeout(() => {
      setIsMouseDown(false);
      setIsDragging(false);
      setDragStartPosition(null);
    }, 50);
  };

  // 双击事件 - 将节点左上角居中显示
  const handleDoubleClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // 阻止默认行为和事件冒泡
    e.stopPropagation();

    console.log("双击节点:", id);

    // 双击时立即隐藏工具栏
    setIsMouseDown(true);
    setIsDragging(true); // 设置为拖拽状态，防止工具栏显示

    setTimeout(() => {
      setIsMouseDown(false);
      setIsDragging(false);
    }, 850); // 动画完成后再重置状态 (800ms + 50ms缓冲)

    // 获取节点位置信息并居中显示
    const node = getNode(id);
    if (node) {
      console.log("找到节点，位置:", { x: node.position.x, y: node.position.y });

      try {
        // 使用setCenter将节点的左上角居中显示
        await setCenter(
          node.position.x + 150, // 节点的x坐标
          node.position.y + 100, // 节点的y坐标
          {
            zoom: 1.5, // 可选：设置缩放级别
            duration: 800 // 动画持续时间（毫秒）
          }
        );
        console.log("成功使用setCenter居中节点到左上角:", node.position);
      } catch (error) {
        console.error("setCenter失败:", error);
      }
    } else {
      console.log("未找到节点:", id);
    }
  };



  return (
    <>
      {/* NodeToolbar - 颜色选择工具 */}
      <NodeToolbar
        isVisible={selected && !isMouseDown && !isDragging}
        position={Position.Top}
        offset={10}
        className="color-toolbar"
      >
        <ColorTool
          nodeId={id}
          currentColor={nodeData.backgroundColor || "#ffffff"}
          onColorChange={handleColorChange}
        />
      </NodeToolbar>

      <div
        className={`${styles.customNode} ${selected ? styles.active : ""}`}
        style={{
          backgroundColor: nodeData.backgroundColor || "white",
          borderColor: nodeData.borderColor || "#ccc",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Target Handle - 顶部 */}
        <Handle
          type="target"
          position={Position.Top}
          className={styles.handle}
          style={{
            backgroundColor: nodeData.handleColor || "#ccc",
            borderColor: nodeData.handleColor || "#ccc",
          }}
        />

        {/* 节点内容 */}
        <div className={styles.nodeContent}>
          <div className={styles.nodeTitle}>
            {nodeData.label}
            {nodeData.isStreaming && (
              <span className={styles.streamingIndicator}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </span>
            )}
          </div>
          {nodeData.description && (
            <div className={styles.nodeDescription}>
              {nodeData.nodeType === 'user' ? (
                <div className={styles.userMessage}>{nodeData.description}</div>
              ) : (
                <div className={styles.aiMessage}>
                  {/* 显示思考过程 */}
                  {nodeData.thinking && (
                    <div className={styles.thinkingSection}>
                      <div className={styles.thinkingHeader}>
                        🤔 思考过程
                      </div>
                      <div className={styles.thinkingContent}>
                        <pre className={styles.thinkingText}>{nodeData.thinking}</pre>
                      </div>
                    </div>
                  )}

                  {/* 显示回复内容 */}
                  {nodeData.content && (
                    <div className={styles.contentSection}>
                      <div className={styles.contentHeader}>
                        💬 回复内容
                      </div>
                      <div className={styles.contentBody}>
                        <MarkdownRenderer content={nodeData.content} />
                      </div>
                    </div>
                  )}

                  {/* 显示description（临时状态，用于流式更新） */}
                  {!nodeData.thinking && !nodeData.content && nodeData.description && (
                    <div className={styles.contentBody}>
                      <pre className={styles.messageContent}>{nodeData.description}</pre>
                    </div>
                  )}

                  {/* 流式状态指示器 */}
                  {nodeData.isStreaming && !nodeData.content && (
                    <div className={styles.streamingText}>AI正在思考...</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Source Handle - 底部 */}
        <Handle
          type="source"
          position={Position.Bottom}
          className={styles.handle}
          style={{
            backgroundColor: nodeData.handleColor || "#ccc",
            borderColor: nodeData.handleColor || "#ccc",
          }}
        />
      </div>
    </>
  );
};

export default CustomNode;

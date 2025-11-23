import { Handle, Position } from "@xyflow/react";
import styles from "./node.module.scss";
import { Blend, ChevronDown, Pencil } from "lucide-react";
import { Button } from "antd";
import { useCallback, useState, useLayoutEffect, useRef } from "react";

const CustomNode = ({ data }: { data: { label: string } }) => {
  const [isMore, setIsMore] = useState(false);
  const [showMore, setShowMore] = useState(true);
  const [contentHeight, setContentHeight] = useState(0);

  // 使用 useRef 而不是 useCallback，或者在 effect 中测量，通常更稳定
  const innerContentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (innerContentRef.current) {
      const height = innerContentRef.current.scrollHeight;
      setContentHeight(height);
      // 只有高度超过 200 (举例) 才显示折叠按钮，你可以根据需求调整这个阈值
      // 这里要注意：如果你想默认折叠，需要把初始的 showMore 设为 false
      setIsMore(height > 100);
    }
  }, [data.label]); // 当数据变化时重新测量

  return (
    <div className={styles.customNode}>
      <div className={styles.nodeTitle}>This is node title</div>
      <Handle type="target" position={Position.Top} />

      {isMore && (
        <div
          className={`${showMore ? styles.hiddenTip : styles.showTip} ${
            styles.showMoreTip
          }`}
          onClick={(e) => {
            // 阻止事件冒泡，防止触发 Node 的点击选中
            e.stopPropagation();
            setShowMore((prev) => !prev);
          }}
        >
          show more......
        </div>
      )}
      <div
        className={`${styles.textWrapper} nowheel`}
        style={{
          height: showMore ? contentHeight : 0,
        }}
      >
        {/* 内层 Div: 负责撑开高度供测量 */}
        <div ref={innerContentRef}>{data.label}</div>
      </div>

      <div className={styles.nodeTool}>
        <Button icon={<Blend />} className={styles.toolItem} />
        <Button icon={<Pencil />} className={styles.toolItem} />

        {/* 只有内容确实很长时才显示按钮 */}
        {isMore && (
          <Button
            icon={
              <ChevronDown
                size={16} // 建议给 icon 一个明确大小
                style={{
                  transform: showMore ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              />
            }
            className={styles.toolItem}
            onClick={(e) => {
              // 阻止事件冒泡，防止触发 Node 的点击选中
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

export default CustomNode;

"use client";

import {
  NodeResizer,
  NodeToolbar,
  type Node,
  type NodeProps,
  useReactFlow,
  useOnSelectionChange,
  useInternalNode,
  Handle,
  Position,
} from "@xyflow/react";
import { useCallback, useState } from "react";
import { generateColorScheme } from "@/app/(cilent)/utils/colorAlgorithm";
import type { ColorResult } from "@/app/(cilent)/utils/colorAlgorithm";
import styles from "./customNode.module.scss";
import { Focus } from "lucide-react";
import { Collapse, CollapseProps } from "antd";
import MarkdownRenderer from "@/app/(cilent)/components/MarkdownRenderer";

export type RectangleNodeType = Node<
  { color: string; label: string; content: { think?: string; val: string } },
  "custom"
>;

const colorOptions = [
  "#f5efe9", //  light warm grey
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#64748b", // gray
];

const CustomNode = ({
  id,
  selected,
  dragging,
  data: {
    color,
    label,
    content: { think = "", val },
  },
}: NodeProps<RectangleNodeType>) => {
  const { updateNodeData, setCenter } = useReactFlow();
  const internalNode = useInternalNode(id);
  const [multipleNodesSelected, setMultipleNodesSelected] = useState(false);
  const [colors, setColors] = useState<ColorResult>();

  const onSelectionChange = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      if (nodes.length > 1) {
        setMultipleNodesSelected(true);
      } else {
        setMultipleNodesSelected(false);
      }
    },
    [setMultipleNodesSelected]
  );

  useOnSelectionChange({ onChange: onSelectionChange });

  const handleColorChange = (newColor: string) => {
    const colors = generateColorScheme(newColor);
    console.log(colors, "colors");
    setColors(colors);
    updateNodeData(id, { color: newColor });
  };

  const setViewCenter = () => {
    console.log(internalNode, "internalNode");
    const absolutePosition = internalNode?.internals.positionAbsolute ?? {
      x: 0,
      y: 0,
    };
    const measuredSize = internalNode?.measured ?? { width: 0, height: 0 };
    const width = measuredSize?.width ?? 0;
    const height = measuredSize?.height ?? 0;
    const centerX = absolutePosition.x + width / 2;
    const centerY = absolutePosition.y + height / 2;
    setCenter(centerX, centerY, {
      zoom: 1.5,
      duration: 800,
    });
  };

  const items: CollapseProps["items"] = [
    {
      key: "1",
      label: "思考内容",
      children: <span>{think}</span>,
    },
  ];

  return (
    <div
      style={{
        backgroundColor: color,
        width: "100%",
        height: "100%",
        borderColor: colors?.borderColor,
        color: colors?.textColor,
      }}
      className={`${styles.nodeRoot} nowheel`}
    >
      <Handle type="target" position={Position.Top} />
      <NodeResizer
        minWidth={200}
        minHeight={100}
        maxWidth={400}
        isVisible={selected && !dragging}
      />
      <NodeToolbar
        isVisible={selected && !dragging && !multipleNodesSelected}
        className="nopan"
      >
        <div className={styles.toolBar}>
          {colorOptions.map((colorOption) => (
            <button
              key={colorOption}
              onClick={() => handleColorChange(colorOption)}
              className={styles.colorButton}
              style={{
                backgroundColor: colorOption,
              }}
              title={`Set color to ${colorOption}`}
            />
          ))}
          <div className={styles.viewTool}>
            <Focus
              size={18}
              className={styles.focusIcon}
              onClick={setViewCenter}
            />
          </div>
        </div>
      </NodeToolbar>
      <div style={{ padding: "10px" }}>
        <div>{label}</div>
        {think && <Collapse items={items} defaultActiveKey={["1"]} />}

        <MarkdownRenderer content={val}  />
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export default CustomNode;

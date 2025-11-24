"use client";

import { ReactFlow, MiniMap, Node, Controls } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useState } from "react";
import CustomNode from "./CustomNode";

const defaultNodes = [
  {
    id: "1",
    type: "custom",
    data: { label: "Output Node" },
    position: { x: 250, y: 250 },
  },
];

const defaultEdges = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3", animated: true },
];

const nodeColor = (node: Node): string => {
  const color = node.data?.color;
  return typeof color === "string" ? color : "#eee";
};

const nodeTypes = {
  custom: CustomNode,
};

const fitViewOptions = {
  minZoom: 0.5,
  maxZoom: 0.9,
  duration: 800,
};

const Flow = () => {
  const [nodes, setNodes] = useState(defaultNodes);
  const [edges, setEdges] = useState(defaultEdges);
  return (
    <ReactFlow
      defaultNodes={nodes}
      defaultEdges={edges}
      fitView
      fitViewOptions={fitViewOptions}
      nodeTypes={nodeTypes}
    >
      <MiniMap nodeColor={nodeColor} zoomable pannable />
      <Controls fitViewOptions={fitViewOptions} />
    </ReactFlow>
  );
};

export default Flow;

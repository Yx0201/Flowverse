"use client";
import {
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";
import type {
  NodeChange,
  EdgeChange,
  Connection,
  Node,
  Edge,
} from "@xyflow/react";
import CustomNode from "./CustomNode";

// 定义节点类型
const nodeTypes = {
  customNode: CustomNode,
};

const initialNodes: Node[] = [
  {
    id: "assistant-1",
    position: { x: 100, y: 100 },
    type: "customNode",
    data: {
      label: "智能助手",
      description: "我是智能助手，欢迎提问",
      nodeType: "AI"
    },
  },
];
const initialEdges: Edge[] = [];

const fitViewOptions = {
  minZoom: 0.5, // 最小缩放
  maxZoom: 0.9, // 最大缩放
  duration: 500, // 过渡动画 800ms
};

export default function FlowContent() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  );

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={fitViewOptions}
        nodeTypes={nodeTypes}
      >
        <Controls fitViewOptions={fitViewOptions} />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

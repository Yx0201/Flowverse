"use client";

import {
  ReactFlow,
  MiniMap,
  Node,
  Edge,
  Controls,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useRef, useCallback } from "react";
import CustomNode, { type RectangleNodeType } from "./CustomNode";
import type { Message } from "@/app/(cilent)/type";
import { parseAIContent } from "@/app/(cilent)/utils/contentParser";

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

// 根据角色获取节点标签
const getNodeLabel = (role: Message["role"]): string => {
  switch (role) {
    case "user":
      return "用户提问";
    case "assistant":
      return "AI回复";
    case "system":
      return "系统消息";
    default:
      return "未知消息";
  }
};

// 根据角色获取节点颜色
const getNodeColor = (role: Message["role"]): string => {
  switch (role) {
    case "user":
      return "#e0f2fe"; // 浅蓝色
    case "assistant":
      return "#f0fdf4"; // 浅绿色
    case "system":
      return "#fef3c7"; // 浅黄色
    default:
      return "#f5efe9"; // 默认灰色
  }
};

const Flow = ({ message }: { message?: Message[] }) => {
  const { setNodes, setEdges, getNodes, getEdges, setCenter } = useReactFlow();
  const processedMessagesRef = useRef<Set<number>>(new Set());
  const lastAiMessageIdRef = useRef<string | null>(null);

  // 计算节点位置
  const calculateNodePosition = useCallback(
    (existingNodes: Node[]): { x: number; y: number } => {
      const defaultX = 250;
      const defaultY = 50;
      const verticalSpacing = 50;

      if (existingNodes.length === 0) {
        return { x: defaultX, y: defaultY };
      }

      const lastNode = existingNodes[existingNodes.length - 1];
      return {
        x: lastNode.position.x,
        y:
          lastNode.position.y +
          (lastNode.measured?.height || 120) +
          verticalSpacing,
      };
    },
    []
  );

  // 创建新节点
  const createNodeFromMessage = useCallback(
    (
      message: Message,
      position: { x: number; y: number }
    ): RectangleNodeType => {
      let contentData: { think: string; val: string };

      if (message.role === "assistant") {
        // 对AI回复内容进行解析
        const parsed = parseAIContent(message.content);
        contentData = {
          think: parsed.think,
          val: parsed.val
        };
      } else {
        // 非AI回复直接使用原内容
        contentData = {
          think: "",
          val: message.content
        };
      }

      return {
        id: message.id.toString(),
        type: "custom",
        position,
        data: {
          color: getNodeColor(message.role),
          label: getNodeLabel(message.role),
          content: contentData,
        },
      };
    },
    []
  );

  // 处理消息变化的主要逻辑
  useEffect(() => {
    if (!message || message.length === 0) return;

    const currentNodes = getNodes();
    const currentEdges = getEdges();

    // 找出需要处理的新消息或更新的消息
    const messagesToProcess = message.filter(
      (msg) =>
        !processedMessagesRef.current.has(msg.id) ||
        (msg.role === "assistant" && msg.content.trim() !== "")
    );

    if (messagesToProcess.length === 0) return;

    const newNodes = [...currentNodes];
    const newEdges = [...currentEdges];
    let needsUpdate = false;

    messagesToProcess.forEach((msg) => {
      const nodeId = msg.id.toString();
      const existingNode = newNodes.find((node) => node.id === nodeId);

      if (existingNode) {
        // 如果节点已存在，更新内容（主要用于AI流式输出）
        const currentContent =
          (existingNode.data as RectangleNodeType["data"]).content?.val || "";
        if (currentContent !== msg.content) {
          let newContentData: { think: string; val: string };

          if (msg.role === "assistant") {
            // 对AI回复内容进行重新解析
            const parsed = parseAIContent(msg.content);
            newContentData = {
              think: parsed.think,
              val: parsed.val
            };
          } else {
            // 非AI回复保持原有逻辑
            newContentData = {
              think: (existingNode.data as RectangleNodeType["data"]).content?.think || "",
              val: msg.content
            };
          }

          existingNode.data = {
            ...existingNode.data,
            content: newContentData,
          };
          needsUpdate = true;
        }
      } else {
        // 创建新节点
        const position = calculateNodePosition(newNodes);
        const newNode = createNodeFromMessage(msg, position);

        newNodes.push(newNode);

        // 如果不是第一个节点，创建与上一个节点的连接
        if (newNodes.length > 1) {
          const prevNode = newNodes[newNodes.length - 2];
          const newEdge: Edge = {
            id: `${prevNode.id}-${nodeId}`,
            source: prevNode.id,
            target: nodeId,
  
          };
          newEdges.push(newEdge);
        }

        needsUpdate = true;

        // 如果是AI回复，记录ID用于后续更新
        if (msg.role === "assistant") {
          lastAiMessageIdRef.current = nodeId;
        }
      }

      // 标记消息为已处理
      processedMessagesRef.current.add(msg.id);
    });

    // 只在有变化时更新状态
    if (needsUpdate) {
      setNodes(newNodes);
      setEdges(newEdges);

      // 自动聚焦到最新节点
      if (newNodes.length > currentNodes.length) {
        const latestNode = newNodes[newNodes.length - 1];
        setTimeout(() => {
          setCenter(
            latestNode.position.x + 200, // 假设节点宽度约为300px
            latestNode.position.y + 60, // 假设节点高度约为120px
            { zoom: 1, duration: 500 }
          );
        }, 100);
      }
    }
  }, [
    message,
    getNodes,
    getEdges,
    setNodes,
    setEdges,
    setCenter,
    calculateNodePosition,
    createNodeFromMessage,
  ]);

  return (
    <ReactFlow
      defaultNodes={[]}
      defaultEdges={[]}
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

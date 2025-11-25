"use client";

import {
  ReactFlow,
  MiniMap,
  Node,
  Controls,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useState, useEffect, useRef } from "react";
import CustomNode from "./CustomNode";
import type { addNodeProps } from "@/app/(cilent)/type";

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

const Flow = ({ message }: { message?: addNodeProps }) => {
  const { setNodes, setEdges, getNodes, getEdges, setCenter, updateNodeData } =
    useReactFlow();
  const nodeCountRef = useRef(0);
  // 保存当前正在等待 AI 流式更新的 AI 节点 id
  const aiNodeIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!message) return;

    const currentNodes = getNodes();
    const currentEdges = getEdges();

    // 获取最后一个节点
    const lastNode =
      currentNodes.length > 0 ? currentNodes[currentNodes.length - 1] : null;

    // 默认位置（空画布）
    const defaultX = 250;
    const defaultY = 50;

    // 生成新节点id（并不会马上 setNodes）
    const nextId = () => `node-${nodeCountRef.current + 1}`;

    // Helper：基于基准节点计算下一个 y
    const computeBelowPosition = (baseNode: any, extraY = 50) => {
      if (!baseNode) return { x: defaultX, y: defaultY };
      const height = baseNode.measured?.height ?? 100;
      return {
        x: baseNode.position.x,
        y: baseNode.position.y + height + extraY,
      };
    };

    if (message.label === "User Node") {
      // 创建用户节点和一个空的 AI 节点
      const userNodeId = nextId();
      nodeCountRef.current += 1;
      const userPos = lastNode
        ? computeBelowPosition(lastNode)
        : { x: defaultX, y: defaultY };

      const userNode = {
        id: userNodeId,
        data: {
          label: message.label,
          content: message.content,
          color: "#fefefe",
        },
        position: userPos,
        type: "custom",
      };

      // 创建 AI 节点，初始 content 为空，后续流式更新会更新它
      const aiNodeId = `node-${nodeCountRef.current + 1}`;
      nodeCountRef.current += 1;
      const aiPos = computeBelowPosition(userNode);

      const aiNode = {
        id: aiNodeId,
        data: {
          label: "Ai Node",
          content: { think: "", val: "" },
          color: "#f7f7fa",
        },
        position: aiPos,
        type: "custom",
      };

      // 存储 ai 节点 id 以便后续 updateNodeData 使用
      aiNodeIdRef.current = aiNodeId;

      // 添加 nodes
      setNodes([...currentNodes, userNode, aiNode]);

      // 添加 edges： (lastNode -> userNode) + (userNode -> aiNode)
      const newEdges: any[] = [];
      if (lastNode) {
        newEdges.push({
          id: `edge-${lastNode.id}-${userNodeId}`,
          source: lastNode.id,
          target: userNodeId,
        });
      }
      newEdges.push({
        id: `edge-${userNodeId}-${aiNodeId}`,
        source: userNodeId,
        target: aiNodeId,
      });

      setEdges([...currentEdges, ...newEdges]);

      // 将视图聚焦到 AI 节点中央
      setCenter(aiPos.x + 100, aiPos.y + 50, {
        zoom: 1.5,
        duration: 800,
      });
    } else if (message.label === "Ai Node") {
      // AI 流式更新：优先尝试更新之前创建好的 AI 节点
      const targetAiId = aiNodeIdRef.current;
      if (targetAiId) {
        // 更新 AI 节点的数据
        updateNodeData(targetAiId, {
          content: {
            think: message.content?.think ?? "",
            val: message.content?.val ?? "",
          },
        });
        // 继续聚焦在当前 AI 节点（可选）
        const targetNode = currentNodes.find((n) => n.id === targetAiId);
        if (targetNode) {
          setCenter(
            targetNode.position.x + (targetNode.measured?.width ?? 200) / 2,
            targetNode.position.y + (targetNode.measured?.height ?? 100) / 2,
            {
              zoom: 1.5,
              duration: 400,
            }
          );
        }
      } else {
        // 如果没有缓存的 AI 节点 id，则回退到创建单独的 AI 节点
        const newNodeId = nextId();
        nodeCountRef.current += 1;
        const newPosition = lastNode
          ? computeBelowPosition(lastNode)
          : { x: defaultX, y: defaultY };

        const newNode = {
          id: newNodeId,
          data: {
            label: "Ai Node",
            content: {
              think: message.content?.think ?? "",
              val: message.content?.val ?? "",
            },
            color: "#fefefe",
          },
          position: newPosition,
          type: "custom",
        };

        setNodes([...currentNodes, newNode]);
        if (lastNode) {
          setEdges([
            ...currentEdges,
            {
              id: `edge-${lastNode.id}-${newNodeId}`,
              source: lastNode.id,
              target: newNodeId,
            },
          ]);
        }
        setCenter(newPosition.x + 100, newPosition.y + 50, {
          zoom: 1.5,
          duration: 800,
        });

        // 缓存这个 AI 节点 id
        aiNodeIdRef.current = newNodeId;
      }
    } else {
      // 其他情况（通用单节点创建逻辑）
      const newNodeId = nextId();
      nodeCountRef.current += 1;
      const newPosition = lastNode
        ? computeBelowPosition(lastNode)
        : { x: defaultX, y: defaultY };

      const newNode = {
        id: newNodeId,
        data: {
          label: message.label ?? "Node",
          content: message.content ?? { val: "" },
          color: "#fefefe",
        },
        position: newPosition,
        type: "custom",
      };

      setNodes([...currentNodes, newNode]);

      if (lastNode) {
        setEdges([
          ...currentEdges,
          {
            id: `edge-${lastNode.id}-${newNodeId}`,
            source: lastNode.id,
            target: newNodeId,
          },
        ]);
      }

      setCenter(newPosition.x + 100, newPosition.y + 50, {
        zoom: 1.5,
        duration: 800,
      });
    }
  }, [
    message,
    setNodes,
    setEdges,
    getNodes,
    getEdges,
    setCenter,
    updateNodeData,
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

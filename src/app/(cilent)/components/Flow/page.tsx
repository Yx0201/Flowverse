"use client";
import { useCallback, useEffect, useState, useRef } from "react";
import {
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  ReactFlowProvider,
  PanOnScrollMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type {
  EdgeChange,
  Edge,
  Node,
  NodeChange,
  Connection,
} from "@xyflow/react";

import { nodeTypes, UserNodeData, AiNodeData } from "./nodeTypes";

// 节点创建事件类型定义
export interface NodeCreateEvent {
  type: "user" | "ai";
  message: string;
  isStreaming?: boolean;
  isComplete?: boolean;
  messageId?: string;
}

const fitViewOptions = {
  minZoom: 0.3,
  maxZoom: 0.9,
  duration: 800,
};

// 初始节点 - 欢迎节点
const initialNodes: Node[] = [
  {
    id: "welcome",
    type: "aiNode",
    position: { x: 100, y: 0 },
    data: {
      type: "ai",
      label: "你好！我是AI助手，有什么可以帮助你的吗？",
      message: "你好！我是AI助手，有什么可以帮助你的吗？",
      timestamp: new Date().toISOString(),
      isStreaming: false,
      isComplete: true,
    },
  },
];

const initialEdges: Edge[] = [];

interface FlowComponentProps {
  onNodeCreate?: (event: NodeCreateEvent) => void;
  onMethodsReady?: (methods: FlowMethods) => void;
}

const FlowComponent = ({ onMethodsReady }: FlowComponentProps) => {
  "use memo"; // Opt-in for React Compiler optimization

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const { getNodes, setCenter } = useReactFlow();
  const lastCenteredNodeIdRef = useRef<string | null>(null); // 记录上次调整视图的节点ID

  // 节点变化处理
  const onNodesChange = useCallback(
    (changes: NodeChange<Node>[]) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );

  // 边变化处理
  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );

  // 连接处理
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  );

  /**
   * 估算AI节点高度（基于内容长度）
   */
  const estimateNodeHeight = useCallback((aiNodeData: AiNodeData): number => {
    const thinkingHeight = aiNodeData.thinking
      ? Math.min(200, Math.max(60, aiNodeData.thinking.length * 0.4))
      : 0;
    const messageHeight = Math.max(
      110,
      Math.min(500, aiNodeData.message.length * 0.25)
    );

    // 基础高度 + 思考过程 + 正式回答 + 边距
    return 60 + thinkingHeight + messageHeight + 40;
  }, []);

  /**
   * 动态调整AI节点的视图中心
   * 当AI节点内容过长时，调整视图让左下角位于视觉中心
   */
  const adjustAiNodeViewCenter = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node || node.type !== "aiNode") return;

      const aiNodeData = node.data as AiNodeData;

      // 如果AI节点已经完成，不再调整视图（避免覆盖完成时的左上角定位）
      if (aiNodeData.isComplete) {
        return;
      }

      // 优先使用内容预测高度，这样可以在DOM更新前就进行调整
      let nodeHeight = estimateNodeHeight(aiNodeData);

      // 如果有测量的实际高度，且与预测值差异较大，使用实际高度
      const measuredHeight = node.measured?.height;
      if (measuredHeight && Math.abs(measuredHeight - nodeHeight) > 50) {
        nodeHeight = measuredHeight;
      }

      // 如果没有测量高度，尝试通过DOM查询获取实际高度
      if (!measuredHeight) {
        const nodeElement = document.querySelector(
          `[data-node-id="${nodeId}"]`
        ) as HTMLElement;
        if (nodeElement) {
          const domHeight = nodeElement.getBoundingClientRect().height;
          if (domHeight > 0) {
            nodeHeight = domHeight;
          }
        }
      }

      // 如果节点高度超过150px，立即调整视图中心到左下角
      if (nodeHeight > 150) {
        // 计算左下角的位置
        const leftBottomX = node.position.x;
        const leftBottomY = node.position.y + nodeHeight;

        // 立即调整视图中心到左下角，不使用动画
        setCenter(leftBottomX + 200, leftBottomY, {
          duration: 0, // 无动画延迟
          zoom: 1,
        });

        lastCenteredNodeIdRef.current = nodeId;
      }
    },
    [nodes, setCenter, estimateNodeHeight]
  );

  /**
   * 处理节点双击事件
   * 当用户双击节点时，立即将节点居中显示
   */
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // 获取更准确的节点高度
      let nodeHeight = node.measured?.height;

      // 如果没有测量高度，尝试通过DOM查询获取
      if (!nodeHeight) {
        const nodeElement = document.querySelector(
          `[data-node-id="${node.id}"]`
        ) as HTMLElement;
        if (nodeElement) {
          nodeHeight = nodeElement.getBoundingClientRect().height;
        }
      }

      // 如果仍然没有高度，根据节点类型和内容估算
      if (!nodeHeight) {
        if (node.type === "aiNode") {
          const aiNodeData = node.data as AiNodeData;
          nodeHeight = estimateNodeHeight(aiNodeData);
        } else {
          // 用户节点的高度估算
          const userNodeData = node.data as UserNodeData;
          const messageHeight = Math.max(
            110,
            Math.min(300, userNodeData.message.length * 0.2)
          );
          nodeHeight = messageHeight + 40; // padding + borders
        }
      }

      // 基于左上角的定位策略，确保用户能看到内容的开始部分
      const centerPosition = {
        x: node.position.x + 200, // X坐标偏移200px到视觉中心
        y: node.position.y + 100, // Y坐标基于左上角偏移100px，显示顶部内容
      };

      // 立即调整视图中心
      setCenter(centerPosition.x, centerPosition.y, {
        duration: 300,
        zoom: 1,
      });
    },
    [setCenter, estimateNodeHeight]
  );

  /**
   * AI完成时，将节点左上角定位到视觉中心
   */
  const centerAiNodeTopLeft = useCallback(
    (nodeId: string) => {
      // 使用更长的延时，确保节点数据完全更新
      setTimeout(() => {
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) {
          return;
        }

        if (node.type !== "aiNode") {
          return;
        }

        const aiNodeData = node.data as AiNodeData;

        // 再次检查节点是否确实是完成状态
        if (!aiNodeData.isComplete) {
          return;
        }

        // 基于左上角的定位策略，与双击节点保持一致
        const centerPosition = {
          x: node.position.x + 200, // X坐标偏移200px到视觉中心
          y: node.position.y + 100, // Y坐标基于左上角偏移100px，显示顶部内容
        };

        // 调整视图中心到左上角，使用平滑动画
        setCenter(centerPosition.x, centerPosition.y, {
          duration: 300,
          zoom: 1,
        });
      }, 100); // 增加到100ms，确保所有状态都已更新
    },
    [nodes, setCenter]
  );

  /**
   * 创建用户节点
   */
  const createUserNode = useCallback(
    (message: string) => {
      const currentNodes = getNodes();
      const lastNode =
        currentNodes.length > 0 ? currentNodes[currentNodes.length - 1] : null;

      const { x: lastX = 100, y: lastY = 0 } = lastNode?.position ?? {};
      const { height = 200 } = lastNode?.measured ?? {};

      const newNodeId = `user-${Date.now()}`;
      const newNode: Node<UserNodeData> = {
        id: newNodeId,
        type: "userNode",
        position: {
          x: lastX,
          y: lastY + (height || 200) + 50,
        },
        data: {
          type: "user",
          label: message,
          message,
          timestamp: new Date().toISOString(),
          isStreaming: false,
        },
      };

      // 更新节点
      setNodes((prev) => [...prev, newNode]);

      // 创建连接
      if (lastNode) {
        setEdges((prev) => [
          ...prev,
          {
            id: `${lastNode.id}-${newNodeId}`,
            source: lastNode.id,
            target: newNodeId,
            type: "smoothstep",
            animated: false,
          },
        ]);
      }

      // 移动视图到新节点
      setTimeout(() => {
        setCenter(newNode.position.x + 200, newNode.position.y + 100, {
          duration: 300, // 减少动画时长
          zoom: 1,
        });
      }, 50); // 减少延迟

      return newNodeId;
    },
    [getNodes, setCenter]
  );

  /**
   * 创建AI节点（支持流式更新）
   */
  const createAiNode = useCallback(
    (
      message: string = "",
      parentNodeId: string,
      isStreaming: boolean = false,
      isComplete: boolean = false,
      messageId?: string
    ) => {
      // 使用本地状态中的 nodes 而不是 getNodes()，因为新创建的用户节点可能还没有在 getNodes() 中
      const currentNodes = nodes;
      const parentNode = currentNodes.find((node) => node.id === parentNodeId);

      if (!parentNode) {
        return null;
      }

      const { x: parentX, y: parentY } = parentNode.position;
      const { height = 100 } = parentNode.measured ?? {};

      const newNodeId = messageId || `ai-${Date.now()}`;
      const newNode: Node<AiNodeData> = {
        id: newNodeId,
        type: "aiNode",
        position: {
          x: parentX,
          y: parentY + (height || 100) + 50,
        },
        data: {
          type: "ai",
          label: message,
          message,
          timestamp: new Date().toISOString(),
          isStreaming,
          isComplete,
          messageId: newNodeId,
        },
      };

      // 检查节点是否已存在
      const existingNodeIndex = nodes.findIndex(
        (node) => node.id === newNodeId
      );

      if (existingNodeIndex >= 0) {
        // 更新现有节点
        const updatedNodes = [...nodes];
        updatedNodes[existingNodeIndex] = {
          ...updatedNodes[existingNodeIndex],
          data: {
            ...(updatedNodes[existingNodeIndex].data as AiNodeData),
            ...newNode.data,
          },
        };
        setNodes(updatedNodes);
      } else {
        // 添加新节点
        setNodes((prev) => {
          const newNodes = [...prev, newNode];
          return newNodes;
        });

        // 创建连接
        const newEdge = {
          id: `${parentNodeId}-${newNodeId}`,
          source: parentNodeId,
          target: newNodeId,
          type: "smoothstep" as const,
          animated: isStreaming,
        };
        setEdges((prev) => [...prev, newEdge]);

        // 移动视图到新节点
        if (!isStreaming || message.length === 0) {
          setTimeout(() => {
            setCenter(newNode.position.x + 200, newNode.position.y + 100, {
              duration: 200, // 进一步减少动画时长
              zoom: 1,
            });
          }, 50); // 减少延迟
        }
      }

      return newNodeId;
    },
    [nodes, setCenter]
  );

  /**
   * 更新AI节点内容（用于流式更新）
   */
  const updateAiNode = useCallback(
    (
      nodeId: string,
      message: string,
      isStreaming: boolean,
      isComplete: boolean = false,
      thinking?: string
    ) => {
      setNodes((prev) => {
        const updatedNodes = prev.map((node) => {
          if (node.id === nodeId) {
            const updatedData: Partial<AiNodeData> = {
              label: message,
              message,
              isStreaming,
              isComplete,
            };

            // 如果有思考过程，也更新
            if (thinking !== undefined) {
              updatedData.thinking = thinking;
            }

            return {
              ...node,
              data: {
                ...(node.data as AiNodeData),
                ...updatedData,
              },
            };
          }
          return node;
        });

        // 检查是否找到了节点
        const targetNode = updatedNodes.find((node) => node.id === nodeId);
        if (!targetNode) {
          // Silently continue if node not found
        }

        return updatedNodes;
      });

      // 动态调整视图中心
      if (isStreaming && !isComplete) {
        // 立即检查和调整，不等待任何延时
        adjustAiNodeViewCenter(nodeId);

        // 对于快速输出，使用极高频的检查
        const immediateCheck = () => {
          requestAnimationFrame(() => {
            adjustAiNodeViewCenter(nodeId);
          });
        };

        // 连续检查多次，确保跟上快速输出
        immediateCheck();
        setTimeout(immediateCheck, 5);
        setTimeout(immediateCheck, 15);
        setTimeout(immediateCheck, 30);

        // 然后进行常规检查
        const regularChecks = [60, 100, 150, 200, 300];
        regularChecks.forEach((delay) => {
          setTimeout(() => {
            adjustAiNodeViewCenter(nodeId);
          }, delay);
        });
      } else if (isComplete) {
        // AI完成时，将节点左上角定位到视觉中心

        // 使用更长的延时，并确保所有流式定位调用都已完成
        setTimeout(() => {
          centerAiNodeTopLeft(nodeId);
          // 重置记录，以便下次对话可以重新调整
          if (lastCenteredNodeIdRef.current === nodeId) {
            lastCenteredNodeIdRef.current = null;
          }
        }, 300); // 增加到300ms，确保所有流式定位调用都已完成
      }

      // 更新连接状态
      if (isComplete) {
        setEdges((prev) =>
          prev.map((edge) =>
            edge.target === nodeId ? { ...edge, animated: false } : edge
          )
        );
      } else if (isStreaming) {
        setEdges((prev) =>
          prev.map((edge) =>
            edge.target === nodeId ? { ...edge, animated: true } : edge
          )
        );
      }
    },
    [adjustAiNodeViewCenter, centerAiNodeTopLeft]
  );

  // 暴露方法给父组件
  useEffect(() => {
    const methods: FlowMethods = {
      createUserNode,
      createAiNode,
      updateAiNode,
    };

    // 通过回调传递方法
    onMethodsReady?.(methods);

    // 也暴露到全局（向后兼容）
    (window as unknown as Record<string, unknown>).createUserNode =
      createUserNode;
    (window as unknown as Record<string, unknown>).createAiNode = createAiNode;
    (window as unknown as Record<string, unknown>).updateAiNode = updateAiNode;
  }, [createUserNode, createAiNode, updateAiNode, onMethodsReady]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeDoubleClick={handleNodeDoubleClick}
      fitView
      nodeTypes={nodeTypes}
      fitViewOptions={fitViewOptions}
      defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
      multiSelectionKeyCode={null} // 禁用多选，确保单选行为
      zoomOnScroll={false} // 禁用滚轮缩放
      zoomOnPinch={true} // 保留捏合缩放
      panOnScroll={true} // 启用滚轮平移
      panOnScrollMode={PanOnScrollMode.Vertical} // 只允许垂直方向平移
    >
      <Controls fitViewOptions={fitViewOptions} />
      <MiniMap />
    </ReactFlow>
  );
};

// 暴露给外部的接口
interface FlowMethods {
  createUserNode: (message: string) => string;
  createAiNode: (
    message: string,
    parentId: string,
    isStreaming: boolean,
    isComplete: boolean,
    messageId?: string
  ) => string | null;
  updateAiNode: (
    nodeId: string,
    message: string,
    isStreaming: boolean,
    isComplete: boolean,
    thinking?: string
  ) => void;
}

interface FlowProps {
  onMethodsReady?: (methods: FlowMethods) => void;
}

const Flow = ({ onMethodsReady }: FlowProps) => {
  "use memo"; // Opt-in for React Compiler optimization

  const methodsRef = useRef<FlowMethods | null>(null);

  return (
    <div style={{width:'100%',height:'100%'}}>
      <ReactFlowProvider>
        <FlowComponent
          onMethodsReady={(methods) => {
            methodsRef.current = methods;
            onMethodsReady?.(methods);

            // 暴露到全局 window 对象
            (window as unknown as Record<string, unknown>).flowMethods =
              methods;
          }}
        />
      </ReactFlowProvider>
    </div>
  );
};

export default Flow;

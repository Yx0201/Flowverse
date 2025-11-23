"use client";

import { useCallback, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Node, Edge } from '@xyflow/react';
import useLLMChat from './useLLMChat';
import {
  NodeType,
  CustomNodeData,
  ConversationFlowState,
  InputHandlers,
  NodeManagementHandlers
} from '@/types/flow';

// 扩展React Flow节点类型
interface ExtendedNode extends Node {
  data: CustomNodeData;
  type: 'customNode';
}

/**
 * 对话流程管理Hook
 * 处理用户输入、AI回复、节点创建和更新逻辑
 */
const useConversationFlow = () => {
  const { addNodes, setNodes, setEdges, setCenter, getNodes } = useReactFlow();
  const { sendMessage, isStreaming, stopStreaming } = useLLMChat();

  // 对话状态管理
  const [conversationState, setConversationState] = useState<ConversationFlowState>({
    isProcessing: false,
    currentUserMessageId: null,
    currentAiMessageId: null,
    messageHistory: [],
  });

  const aiMessageBufferRef = useRef<Map<string, string>>(new Map());
  const aiThinkingBufferRef = useRef<Map<string, string>>(new Map()); // 思考过程缓存

  /**
   * 生成唯一节点ID
   */
  const generateNodeId = useCallback((type: NodeType): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${type}-${timestamp}-${random}`;
  }, []);

  
  /**
   * 获取最后一个节点
   */
  const getLastNode = useCallback((): string | null => {
    const nodes = getNodes();
    if (nodes.length === 0) return null;
    return nodes[nodes.length - 1].id;
  }, [getNodes]);

  /**
   * 获取最后一个节点的位置和尺寸信息
   */
  const getLastNodeInfo = useCallback((): { id: string; position: { x: number; y: number }; width?: number; height?: number } | null => {
    const nodes = getNodes();
    if (nodes.length === 0) return null;
    const lastNode = nodes[nodes.length - 1];
    return {
      id: lastNode.id,
      position: lastNode.position,
      width: lastNode.measured?.width || 200, // 默认宽度200px
      height: lastNode.measured?.height || 80, // 默认高度80px
    };
  }, [getNodes]);

  /**
   * 创建连接线
   */
  const createConnection = useCallback((sourceId: string, targetId: string, animated = false) => {
    const newEdge: Edge = {
      id: `${sourceId}-${targetId}`,
      source: sourceId,
      target: targetId,
      animated,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    };

    setEdges((currentEdges) => [...currentEdges, newEdge]);
  }, [setEdges]);

  /**
   * 更新连接线的动画状态
   */
  const updateEdgeAnimation = useCallback((edgeId: string, animated: boolean) => {
    setEdges((currentEdges) =>
      currentEdges.map((edge) =>
        edge.id === edgeId ? { ...edge, animated } : edge
      )
    );
  }, [setEdges]);

  /**
   * 创建新节点
   */
  const createNode = useCallback(async (
    type: NodeType,
    label: string,
    description?: string,
    content?: string,
    thinking?: string
  ): Promise<string> => {
    const nodeId = generateNodeId(type);
    const timestamp = new Date().toISOString();
    const lastNodeInfo = getLastNodeInfo();

    // 计算新节点位置：基于上一个节点的位置和尺寸
    let position: { x: number; y: number };
    if (lastNodeInfo) {
      // 新节点的x位置与上一个节点相同
      // 新节点的y位置 = 上一个节点的y + 上一个节点的高度 + 100px间距
      position = {
        x: lastNodeInfo.position.x,
        y: lastNodeInfo.position.y + (lastNodeInfo.height || 80) + 100
      };
    } else {
      // 如果没有上一个节点，使用默认位置
      position = { x: 100, y: 100 };
    }

    const nodeData: CustomNodeData = {
      label,
      description: description || '',
      nodeType: type,
      timestamp,
      content: content || description || '',
      thinking: thinking || '',
      isStreaming: type === NodeType.AI,
      backgroundColor: type === NodeType.USER ? '#e0f2fe' : '#f0fdf4',
      borderColor: type === NodeType.USER ? '#0284c7' : '#16a34a',
      handleColor: type === NodeType.USER ? '#0ea5e9' : '#22c55e',
    };

    const newNode: ExtendedNode = {
      id: nodeId,
      type: 'customNode',
      position,
      data: nodeData,
    };

    addNodes(newNode as Node);

    // 如果有最后一个节点，创建连接
    if (lastNodeInfo) {
      const newEdge: Edge = {
        id: `${lastNodeInfo.id}-${nodeId}`,
        source: lastNodeInfo.id,
        target: nodeId,
        animated: type === NodeType.AI, // AI节点默认开启动画
        style: { stroke: '#6366f1', strokeWidth: 2 },
      };
      setEdges((currentEdges) => [...currentEdges, newEdge]);
    }

    // 自动聚焦到新创建的节点
    setTimeout(() => {
      setCenter(position.x + 150, position.y + 100, {
        zoom: 1.2,
        duration: 500,
      });
    }, 100);

    return nodeId;
  }, [generateNodeId, addNodes, setCenter, getLastNodeInfo, setEdges]);

  /**
   * 更新节点数据
   */
  const updateNode = useCallback((nodeId: string, data: Partial<CustomNodeData>) => {
    setNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      )
    );
  }, [setNodes]);

  /**
   * 居中显示指定节点
   */
  const centerNode = useCallback(async (nodeId: string) => {
    const nodes = getNodes();
    const targetNode = nodes.find(node => node.id === nodeId);

    if (targetNode) {
      await setCenter(
        targetNode.position.x + 150,
        targetNode.position.y + 100,
        {
          zoom: 1.5,
          duration: 800,
        }
      );
    }
  }, [getNodes, setCenter]);

  /**
   * 处理思考过程更新
   */
  const handleThinkingUpdate = useCallback((nodeId: string, thinking: string) => {
    // 更新思考过程缓冲区
    const currentThinking = aiThinkingBufferRef.current.get(nodeId) || '';
    aiThinkingBufferRef.current.set(nodeId, currentThinking + thinking);

    // 获取当前回复内容
    const currentContent = aiMessageBufferRef.current.get(nodeId) || '';

    // 更新节点显示，优先显示思考过程
    updateNode(nodeId, {
      description: `🤔 正在思考...\n\n${currentThinking + thinking}`,
      thinking: currentThinking + thinking,
    });
  }, [updateNode]);

  /**
   * 处理流式内容更新
   */
  const handleStreamUpdate = useCallback((nodeId: string, content: string) => {
    // 更新缓冲区
    const currentBuffer = aiMessageBufferRef.current.get(nodeId) || '';
    aiMessageBufferRef.current.set(nodeId, currentBuffer + content);

    // 获取当前思考过程
    const currentThinking = aiThinkingBufferRef.current.get(nodeId) || '';

    // 更新节点显示：思考过程 + 回复内容
    updateNode(nodeId, {
      description: `🤔 正在思考...\n\n${currentThinking}\n\n💬 正在回复...\n\n${currentBuffer + content}`,
      content: currentBuffer + content,
    });
  }, [updateNode]);

  /**
   * 处理流式完成
   */
  const handleStreamComplete = useCallback((nodeId: string, fullContent: string) => {
    // 获取完整的思考过程
    const fullThinking = aiThinkingBufferRef.current.get(nodeId) || '';

    // 更新节点显示：思考过程 + 完整回复内容
    updateNode(nodeId, {
      description: `🤔 思考过程\n\n${fullThinking}\n\n💬 回复内容\n\n${fullContent}`,
      content: fullContent,
      thinking: fullThinking,
      isStreaming: false,
    });

    // 清理缓冲区
    aiMessageBufferRef.current.delete(nodeId);
    aiThinkingBufferRef.current.delete(nodeId);

    // 更新对话状态
    setConversationState(prev => ({
      ...prev,
      isProcessing: false,
      currentAiMessageId: null,
    }));
  }, [updateNode]);

  /**
   * 发送消息并处理完整流程
   */
  const sendMessageFlow = useCallback(async (message: string) => {
    if (!message.trim() || conversationState.isProcessing) {
      return;
    }

    try {
      // 设置处理状态
      setConversationState(prev => ({
        ...prev,
        isProcessing: true,
      }));

      // 1. 创建用户节点
      const userNodeId = await createNode(NodeType.USER, '用户提问', message);

      // 2. 创建AI节点（初始显示"正在思考"）
      const aiNodeId = await createNode(NodeType.AI, 'AI 回复', '正在思考...', '', '🤔 思考中...');

      // 3. 更新对话状态
      setConversationState(prev => ({
        ...prev,
        currentUserMessageId: userNodeId,
        currentAiMessageId: aiNodeId,
        messageHistory: [
          ...prev.messageHistory,
          {
            id: `msg-${Date.now()}`,
            type: NodeType.USER,
            content: message,
            timestamp: new Date().toISOString(),
            nodeIds: [userNodeId, aiNodeId],
          },
        ],
      }));

      // 4. 开启动画边（用户到AI的连接）
      const edgeId = `${userNodeId}-${aiNodeId}`;
      updateEdgeAnimation(edgeId, true);

      // 5. 发送消息给AI
      await sendMessage(
        message,
        // onStreamContent - 处理流式内容
        (content: string) => {
          handleStreamUpdate(aiNodeId, content);
        },
        // onStreamThinking - 处理思考过程
        (thinking: string) => {
          handleThinkingUpdate(aiNodeId, thinking);
        },
        // onStreamComplete - 处理完成
        (fullResponse: string) => {
          handleStreamComplete(aiNodeId, fullResponse);
          // AI回复完成后关闭动画
          updateEdgeAnimation(edgeId, false);
        },
        // onStreamError - 处理错误
        (error: string) => {
          console.error('AI回复错误:', error);
          const fullThinking = aiThinkingBufferRef.current.get(aiNodeId) || '';
          updateNode(aiNodeId, {
            description: `🤔 思考过程\n\n${fullThinking}\n\n❌ 回复出错: ${error}`,
            isStreaming: false,
          });
          // 错误时也关闭动画
          updateEdgeAnimation(edgeId, false);
          // 清理缓冲区
          aiMessageBufferRef.current.delete(aiNodeId);
          aiThinkingBufferRef.current.delete(aiNodeId);
          setConversationState(prev => ({
            ...prev,
            isProcessing: false,
            currentAiMessageId: null,
          }));
        }
      );
    } catch (error) {
      console.error('发送消息失败:', error);
      setConversationState(prev => ({
        ...prev,
        isProcessing: false,
        currentUserMessageId: null,
        currentAiMessageId: null,
      }));
    }
  }, [
    conversationState.isProcessing,
    createNode,
    updateEdgeAnimation,
    sendMessage,
    handleThinkingUpdate,
    handleStreamUpdate,
    handleStreamComplete,
    updateNode,
    setConversationState,
  ]);

  /**
   * 停止当前流式回复
   */
  const stopCurrentStreaming = useCallback(() => {
    if (conversationState.currentAiMessageId) {
      updateNode(conversationState.currentAiMessageId, {
        isStreaming: false,
        description: aiMessageBufferRef.current.get(conversationState.currentAiMessageId) + '\n\n[回复已停止]',
      });
    }

    stopStreaming();
    setConversationState(prev => ({
      ...prev,
      isProcessing: false,
      currentAiMessageId: null,
    }));
  }, [conversationState.currentAiMessageId, stopStreaming, updateNode]);

  // 导出处理函数
  const inputHandlers: InputHandlers = {
    onSendMessage: sendMessageFlow,
    onStreamStart: (nodeId: string) => {
      updateNode(nodeId, { isStreaming: true });
    },
    onStreamUpdate: handleStreamUpdate,
    onStreamComplete: handleStreamComplete,
  };

  const nodeHandlers: NodeManagementHandlers = {
    createNode,
    updateNode,
    createConnection,
    centerNode,
  };

  return {
    // 状态
    conversationState,
    isStreaming,

    // 处理函数
    inputHandlers,
    nodeHandlers,

    // 主要方法
    sendMessageFlow,
    stopCurrentStreaming,
    createNode,
    updateNode,
    createConnection,
    updateEdgeAnimation,
    centerNode,
  };
};

export default useConversationFlow;
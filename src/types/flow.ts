import { Node as ReactFlowNode, Edge as ReactFlowEdge } from '@xyflow/react';

/**
 * 节点类型枚举
 */
export enum NodeType {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system'
}

/**
 * 自定义节点数据接口
 */
export interface CustomNodeData {
  label: string;
  description?: string;
  backgroundColor?: string;
  borderColor?: string;
  handleColor?: string;
  nodeType?: NodeType;
  isStreaming?: boolean;
  timestamp?: string;
  content?: string;
  thinking?: string; // AI思考过程
  [key: string]: unknown;
}

/**
 * 扩展React Flow节点类型
 */
export interface CustomNode extends Omit<ReactFlowNode, 'data' | 'type'> {
  data: CustomNodeData;
  type: 'customNode';
}

/**
 * 扩展React Flow边类型
 */
export interface CustomEdge extends ReactFlowEdge {
  animated?: boolean;
}

/**
 * 流式消息状态
 */
export interface StreamMessageState {
  messageId: string;
  content: string;
  isComplete: boolean;
  timestamp: string;
}

/**
 * 对话流程状态
 */
export interface ConversationFlowState {
  isProcessing: boolean;
  currentUserMessageId: string | null;
  currentAiMessageId: string | null;
  messageHistory: Array<{
    id: string;
    type: NodeType;
    content: string;
    timestamp: string;
    nodeIds: string[];
  }>;
}

/**
 * 输入处理回调
 */
export interface InputHandlers {
  onSendMessage: (message: string) => Promise<void>;
  onStreamStart: (nodeId: string) => void;
  onStreamUpdate: (nodeId: string, content: string) => void;
  onStreamComplete: (nodeId: string, fullContent: string) => void;
}

/**
 * 节点管理回调
 */
export interface NodeManagementHandlers {
  createNode: (type: NodeType, label: string, description?: string) => Promise<string>;
  updateNode: (nodeId: string, data: Partial<CustomNodeData>) => void;
  createConnection: (sourceId: string, targetId: string) => void;
  centerNode: (nodeId: string) => void;
}
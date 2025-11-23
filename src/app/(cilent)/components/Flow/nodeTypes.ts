import { Node } from "@xyflow/react";
import CustomNode from "./CustomNode";
import UserNode from "./UserNode";
import AiNode from "./AiNode";

// 节点数据基础类型
export interface BaseNodeData {
  label: string;
  timestamp?: string;
  isStreaming?: boolean;
  [key: string]: unknown; // 添加索引签名以满足约束
}

// 用户节点数据类型
export interface UserNodeData extends BaseNodeData {
  type: 'user';
  message: string;
}

// AI节点数据类型
export interface AiNodeData extends BaseNodeData {
  type: 'ai';
  message: string;
  thinking?: string; // 思考过程
  isComplete: boolean;
  messageId?: string;
}

// 自定义节点联合类型
export type CustomNodeType = Node<UserNodeData | AiNodeData, "userNode" | "aiNode">;

// 注册node类型 - 定义在组件外部以避免重新渲染
export const nodeTypes = {
  customNode: CustomNode, // 保持向后兼容
  userNode: UserNode,
  aiNode: AiNode,
};

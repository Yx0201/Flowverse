"use client";

import { createContext, useContext, ReactNode } from 'react';
import useConversationFlow from '@/app/(cilent)/hook/useConversationFlow';
import {
  ConversationFlowState,
  InputHandlers,
  NodeManagementHandlers
} from '@/types/flow';

// 创建对话上下文类型
interface ConversationContextValue {
  isStreaming: boolean;
  sendMessageFlow: (message: string) => Promise<void>;
  stopCurrentStreaming: () => void;
  conversationState: ConversationFlowState;
  nodeHandlers: NodeManagementHandlers;
}

// 创建对话上下文
const ConversationContext = createContext<ConversationContextValue | null>(null);

// 自定义hook来访问对话上下文
export const useConversationContext = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversationContext must be used within ConversationProvider");
  }
  return context;
};

interface ConversationProviderProps {
  children: ReactNode;
}

export default function ConversationProvider({
  children,
}: ConversationProviderProps) {
  // 现在可以安全使用useConversationFlow，因为它在ReactFlowProvider内部
  const {
    isStreaming,
    sendMessageFlow,
    stopCurrentStreaming,
    conversationState,
    nodeHandlers,
  } = useConversationFlow();

  const contextValue: ConversationContextValue = {
    isStreaming,
    sendMessageFlow,
    stopCurrentStreaming,
    conversationState,
    nodeHandlers,
  };

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
}
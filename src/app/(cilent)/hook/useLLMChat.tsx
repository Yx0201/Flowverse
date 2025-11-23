"use client";
import { useState, useRef, useCallback } from "react";
import { ChatMessage } from "@/service/ollama";

// 对话状态接口定义
interface ConversationState {
  isLoading: boolean;
  error: string | null;
  conversationHistory: ChatMessage[];
}

// 流式响应块接口
interface StreamChunk {
  type: 'content' | 'thinking' | 'done' | 'error';
  data?: string;
  message?: string;
  timestamp: string;
}

/**
 * LLM 对话 Hook
 * 处理与 AI 模型的流式对话
 */
const useLLMChat = () => {
  const [state, setState] = useState<ConversationState>({
    isLoading: false,
    error: null,
    conversationHistory: [],
  });

  const [currentStreamMessage, setCurrentStreamMessage] = useState<string>("");
  const [currentThinking, setCurrentThinking] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 发送消息并获得流式回复
   * @param userMessage 用户消息
   * @param onStreamContent 流式内容回调
   * @param onStreamThinking 思考过程回调
   * @param onStreamComplete 流式完成回调
   * @param onStreamError 流式错误回调
   */
  const sendMessage = useCallback(
    async (
      userMessage: string,
      onStreamContent?: (content: string) => void,
      onStreamThinking?: (thinking: string) => void,
      onStreamComplete?: (fullResponse: string, fullThinking?: string) => void,
      onStreamError?: (error: string) => void
    ) => {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // 创建新的 AbortController
      abortControllerRef.current = new AbortController();

      try {
        setState(prev => ({
          ...prev,
          isLoading: true,
          error: null,
        }));

        setIsStreaming(true);
        setCurrentStreamMessage("");
        setCurrentThinking("");

        // 构建消息历史
        const messages: ChatMessage[] = [
          ...state.conversationHistory,
          { role: "user", content: userMessage },
        ];

        // 发起流式请求
        const response = await fetch("/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        let fullThinking = "";

        if (!reader) {
          throw new Error("无法获取响应流");
        }

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data: StreamChunk = JSON.parse(line.slice(6));

                switch (data.type) {
                  case 'thinking':
                    if (data.data) {
                      fullThinking += data.data;
                      setCurrentThinking(fullThinking);
                      onStreamThinking?.(data.data);
                    }
                    break;

                  case 'content':
                    if (data.data) {
                      fullResponse += data.data;
                      setCurrentStreamMessage(fullResponse);
                      onStreamContent?.(data.data);
                    }
                    break;

                  case 'done':
                    setIsStreaming(false);

                    // 更新对话历史
                    setState(prev => ({
                      ...prev,
                      conversationHistory: [
                        ...prev.conversationHistory,
                        { role: "user", content: userMessage },
                        { role: "assistant", content: fullResponse },
                      ],
                      isLoading: false,
                    }));

                    onStreamComplete?.(fullResponse, fullThinking);
                    return;

                  case 'error':
                    const errorMsg = data.message || '未知错误';
                    setIsStreaming(false);
                    setState(prev => ({
                      ...prev,
                      isLoading: false,
                      error: errorMsg,
                    }));
                    onStreamError?.(errorMsg);
                    return;
                }
              } catch (parseError) {
                // Silently ignore parsing errors for malformed chunks
              }
            }
          }
        }
      } catch (error) {
        setIsStreaming(false);
        setCurrentStreamMessage("");
        setCurrentThinking("");

        let errorMessage = "未知错误";
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = "请求已取消";
          } else {
            errorMessage = error.message;
          }
        }

        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));

        onStreamError?.(errorMessage);
      }
    },
    [state.conversationHistory]
  );

  /**
   * 停止当前流式响应
   */
  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
    setCurrentStreamMessage("");
    setCurrentThinking("");
    setState(prev => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  /**
   * 清除对话历史
   */
  const clearHistory = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      conversationHistory: [],
    });
    setCurrentStreamMessage("");
    setCurrentThinking("");
    setIsStreaming(false);
  }, []);

  /**
   * 重试最后一次对话
   */
  const retryLastMessage = useCallback(
    async (
      onStreamContent?: (content: string) => void,
      onStreamThinking?: (thinking: string) => void,
      onStreamComplete?: (fullResponse: string, fullThinking?: string) => void,
      onStreamError?: (error: string) => void
    ) => {
      if (state.conversationHistory.length >= 2) {
        const lastUserMessage = state.conversationHistory[state.conversationHistory.length - 2];
        if (lastUserMessage && lastUserMessage.role === 'user') {
          // 移除最后一次的 AI 回复
          const newHistory = state.conversationHistory.slice(0, -1);
          setState(prev => ({
            ...prev,
            conversationHistory: newHistory,
          }));

          // 重新发送用户消息
          await sendMessage(
            lastUserMessage.content,
            onStreamContent,
            onStreamThinking,
            onStreamComplete,
            onStreamError
          );
        }
      }
    },
    [state.conversationHistory, sendMessage]
  );

  return {
    // 状态
    isLoading: state.isLoading,
    error: state.error,
    conversationHistory: state.conversationHistory,
    currentStreamMessage,
    currentThinking,
    isStreaming,

    // 方法
    sendMessage,
    stopStreaming,
    clearHistory,
    retryLastMessage,
  };
};

export default useLLMChat;

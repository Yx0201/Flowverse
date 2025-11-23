"use client";
import SysInput from "../components/SysInput/page";
import styles from "./page.module.scss";
import Flow from "../components/Flow/page";
import { useState, useRef, useCallback, useDeferredValue, useMemo } from "react";
import useLLMChat from "../hook/useLLMChat";

// Import FlowMethods interface
type FlowMethods = {
  createUserNode: (message: string) => string;
  createAiNode: (message: string, parentId: string, isStreaming: boolean, isComplete: boolean, messageId?: string) => string | null;
  updateAiNode: (nodeId: string, message: string, isStreaming: boolean, isComplete: boolean, thinking?: string) => void;
};

const Home = () => {
  'use memo'; // Opt-in for React Compiler optimization

  const [isLoading, setIsLoading] = useState(false);
  const currentAiNodeIdRef = useRef<string | null>(null);
  const lastUserNodeIdRef = useRef<string | null>(null);
  const accumulatedMessageRef = useRef<string>("");
  const accumulatedThinkingRef = useRef<string>("");
  const flowMethodsRef = useRef<FlowMethods | null>(null);

  const {
    sendMessage,
    isStreaming,
    stopStreaming,
  } = useLLMChat();

  // 使用useDeferredValue优化loading状态，提高UI响应性
  const deferredIsLoading = useDeferredValue(isLoading);

  // 使用useMemo优化按钮状态计算
  const inputDisabled = useMemo(() => deferredIsLoading || isStreaming, [deferredIsLoading, isStreaming]);

  // 当Flow方法准备好时保存引用
  const handleFlowMethodsReady = useCallback((methods: FlowMethods) => {
    flowMethodsRef.current = methods;
  }, []);

  // 处理用户输入
  const handleUserInput = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || inputDisabled || !flowMethodsRef.current) return;

    try {
      setIsLoading(true);
      accumulatedMessageRef.current = ""; // 重置累积消息
      accumulatedThinkingRef.current = ""; // 重置累积思考

      // 创建用户节点
      const userNodeId = flowMethodsRef.current.createUserNode?.(userMessage);

      if (!userNodeId) {
        setIsLoading(false);
        return;
      }

      lastUserNodeIdRef.current = userNodeId;

      // 等待一个微任务，确保用户节点已经在状态中
      await new Promise(resolve => setTimeout(resolve, 0));

      // 准备AI节点
      const aiNodeId = `ai-${Date.now()}`;
      currentAiNodeIdRef.current = aiNodeId;

      // 创建空的AI节点（用于流式更新）
      const createdAiNodeId = flowMethodsRef.current.createAiNode?.("", userNodeId, true, false, aiNodeId);

      if (!createdAiNodeId) {
        setIsLoading(false);
        currentAiNodeIdRef.current = null;
        return;
      }

      // 发送消息并获得流式回复
      await sendMessage(
        userMessage,
        // 流式内容回调
        (content: string) => {
          // 累积消息内容
          accumulatedMessageRef.current += content;

          if (currentAiNodeIdRef.current && flowMethodsRef.current) {
            flowMethodsRef.current.updateAiNode?.(
              currentAiNodeIdRef.current!,
              accumulatedMessageRef.current,
              true,
              false
            );
          }
        },
        // 思考过程回调
        (thinking: string) => {
          // 累积思考过程
          accumulatedThinkingRef.current += thinking;

          if (currentAiNodeIdRef.current && flowMethodsRef.current) {
            // 更新AI节点的思考过程
            flowMethodsRef.current.updateAiNode?.(
              currentAiNodeIdRef.current!,
              accumulatedMessageRef.current,
              true, // 仍在流式更新中
              false, // 还未完成
              accumulatedThinkingRef.current
            );
          }
        },
        // 完成回调
        (fullResponse: string, fullThinking?: string) => {
          if (currentAiNodeIdRef.current && flowMethodsRef.current) {
            flowMethodsRef.current.updateAiNode?.(
              currentAiNodeIdRef.current!,
              fullResponse,
              false,
              true,
              fullThinking
            );
          }
          setIsLoading(false);
          currentAiNodeIdRef.current = null;
          accumulatedMessageRef.current = "";
          accumulatedThinkingRef.current = "";
        },
        // 错误回调
        (error: string) => {
          if (currentAiNodeIdRef.current && flowMethodsRef.current) {
            flowMethodsRef.current.updateAiNode?.(
              currentAiNodeIdRef.current!,
              `抱歉，回复时出现错误：${error}`,
              false,
              true
            );
          }
          setIsLoading(false);
          currentAiNodeIdRef.current = null;
          accumulatedMessageRef.current = "";
          accumulatedThinkingRef.current = "";
        }
      );
    } catch (error) {
      setIsLoading(false);
      currentAiNodeIdRef.current = null;
      accumulatedMessageRef.current = "";
      accumulatedThinkingRef.current = "";
    }
  }, [inputDisabled, sendMessage]);

  // 停止当前回复
  const handleStopStreaming = useCallback(() => {
    if (isStreaming) {
      stopStreaming();
      if (currentAiNodeIdRef.current && flowMethodsRef.current) {
        flowMethodsRef.current.updateAiNode?.(
          currentAiNodeIdRef.current!,
          "回复已停止",
          false,
          true
        );
      }
      setIsLoading(false);
      currentAiNodeIdRef.current = null;
      accumulatedThinkingRef.current = "";
    }
  }, [isStreaming, stopStreaming]);

  return (
    <div className={styles.homeRoot}>
      <div className={styles.conversation}>
        <Flow onMethodsReady={handleFlowMethodsReady} />
        <SysInput
          inputChange={handleUserInput}
          disabled={inputDisabled}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
        />
      </div>
    </div>
  );
};

export default Home;

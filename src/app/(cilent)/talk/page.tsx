"use client";
import styles from "./page.module.scss";
import Flow from "../components/Flow/page";
import SysInput from "../components/SysInput/page";
import { useState, useEffect, useCallback } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { Message } from "@/app/(cilent)/type";



const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    // 可以添加一个系统消息作为对话的开始
    {
      role: "system",
      content: "你是一个乐于助人的生活助手，请用简洁的中文回答问题。",
      id: 0,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const sendMessage = useCallback(
    async (userMsg: string) => {
      if (!userMsg.trim() || isLoading) return;

      // 1. 准备并添加用户消息到聊天记录 (用于 UI 和历史记录)
      const userMessage: Message = {
        id: Date.now(),
        content: userMsg,
        role: "user",
      };

      // 2. 初始化 AI 的回复（占位符），并更新消息列表
      const aiPlaceholderId = Date.now() + 1;
      const aiPlaceholder: Message = {
        id: aiPlaceholderId,
        content: "",
        role: "assistant",
      };

      // 使用函数式更新，确保基于最新的状态
      setMessages((prev) => [...prev, userMessage, aiPlaceholder]);
      setIsLoading(true);

      // 3. 构建发送给 API 的完整消息历史 (不包含占位符和仅用于 UI 的 ID)
      const historyToSend = [...messages, userMessage].map(
        ({ role, content }) => ({ role, content })
      );

      const apiEndpoint = "/chat";
      let fullThinkingResponse = ""; // 用于存储完整的思考过程
      let fullAssistantResponse = ""; // 用于存储完整的 AI 响应文本

      try {
        await fetchEventSource(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // **关键修改：** 发送完整的历史记录数组
          body: JSON.stringify({ messages: historyToSend }),

          onmessage(ev) {
            console.log('消息开始接收')
            const rawData = ev.data;

            // 检查是否是 done 事件，并且内容是 [DONE]
            if (ev.event === "done") {
              try {
                const parsedData = JSON.parse(rawData);
                if (parsedData.content === "[DONE]") {
                  return; // 真正的完成信号，停止处理
                }
              } catch {
                // 如果解析失败，继续处理
              }
            }

            if (rawData) {
              try {
                // 解析接收到的 JSON 字符串
                const parsedData = JSON.parse(rawData);
                const content = parsedData.content;
                const type = parsedData.type;

                // 只有当内容存在且不是 [DONE] 标记时才处理
                if (content && content !== "[DONE]") {
                  if (type === 'thinking') {
                    // 处理思考过程
                    fullThinkingResponse += content;
                    // 实时更新 AI 消息，将思考过程显示在特殊格式中
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiPlaceholderId
                          ? { ...msg, content: fullThinkingResponse + (fullAssistantResponse ? `\n\n**回答：**${fullAssistantResponse}` : '') }
                          : msg
                      )
                    );
                  } else if (type === 'ans') {
                    // 处理实际回答内容
                    fullAssistantResponse += content;
                    // 实时更新 AI 消息
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiPlaceholderId
                          ? { ...msg, content: (fullThinkingResponse ? `**思考过程：**\n${fullThinkingResponse}\n\n**回答：**` : '') + fullAssistantResponse }
                          : msg
                      )
                    );
                  } else {
                    // 兼容旧格式（没有type字段的情况）
                    fullAssistantResponse += content;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === aiPlaceholderId
                          ? { ...msg, content: msg.content + content }
                          : msg
                      )
                    );
                  }
                }
              } catch (jsonError) {
                console.error(
                  "Failed to parse SSE JSON data:",
                  rawData,
                  jsonError
                );
                // 如果 JSON 解析失败，可以忽略或给出提示
              }
            }
          },

          onopen: async (response) => {
            console.log('开始sse连接')
            if (response.ok) return;
            throw new Error(
              `Failed to connect to stream. HTTP Status: ${response.status}`
            );
          },

          onerror(err) {
            console.log('出错了')
            console.error("SSE Error:", err);
            // 在错误时，将最后的占位符替换为错误提示
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === aiPlaceholderId
                  ? {
                      ...msg,
                      content:
                        fullAssistantResponse +
                        "\n\n[连接或处理错误，请检查控制台]",
                    }
                  : msg
              )
            );
            setIsLoading(false);
            throw err;
          },

          onclose() {
            console.log('关闭了')
            // 在流关闭时，我们不再需要占位符，但它已经包含了完整的响应。
            // 确保 isLoading 状态结束
            setIsLoading(false);
          },
        });
      } catch (error) {
        console.error("Fetch Event Source Failed:", error);
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  ); // 依赖 messages 确保发送最新的历史记录

  return (
    <div className={styles.homeRoot}>
      <div className={styles.conversation}>
        <Flow message={messages}/>
        <SysInput onSendMessage={sendMessage} />
      </div>
    </div>
  );
};

export default Chat;

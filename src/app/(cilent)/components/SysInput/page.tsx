"use client";

import styles from "./page.module.scss";

import { useState, useRef, useEffect, useCallback } from "react";
import useContentHeight from "@/app/(cilent)/hook/useContentHeight";
import BookOutlined from "@ant-design/icons/lib/icons/BookOutlined";
import UploadOutlined from "@ant-design/icons/lib/icons/UploadOutlined";
import { Button, message } from "antd";

interface SysInputProps {
  disabled?: boolean;
  isStreaming?: boolean;
  onSendMessage?: (message: string) => Promise<void>;
  onStopStreaming?: () => void;
}

const SysInput = ({
  disabled = false,
  isStreaming = false,
  onSendMessage,
  onStopStreaming
}: SysInputProps) => {
  const [value, setValue] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const textBox = useRef<HTMLDivElement>(null);
  const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { measureContentHeight } = useContentHeight();

  // 安全地计算窗口相关的高度，避免在服务器端访问window
  const getSafeHeightCalculations = useCallback(() => {
    if (typeof window === "undefined") {
      // 服务器端渲染时的默认值
      return { DEFAULT_HEIGHT: 120, TOOL_HEIGHT: 30 };
    }
    return {
      DEFAULT_HEIGHT: 0.16 * window.innerHeight + 15, //16vh + 15px padding
      TOOL_HEIGHT: 0.04 * window.innerHeight, //4vh
    };
  }, []);

  const [heightCalculations, setHeightCalculations] = useState(
    getSafeHeightCalculations
  );

  // 在客户端挂载后更新高度计算
  useEffect(() => {
    setHeightCalculations(getSafeHeightCalculations());
  }, [getSafeHeightCalculations]);

  // 优化高度调整逻辑
  const adjustHeight = useCallback(() => {
    if (!textAreaRef.current || !textBox.current) return;

    const { DEFAULT_HEIGHT, TOOL_HEIGHT } = heightCalculations;
    const textArea = textAreaRef.current;
    const textBoxEl = textBox.current;

    const defaultHeight = textArea.clientHeight;
    const allHeight = textArea.scrollHeight;

    if (allHeight > defaultHeight) {
      textBoxEl.style.height = allHeight + TOOL_HEIGHT + "px";
    } else if (allHeight === defaultHeight && defaultHeight > DEFAULT_HEIGHT) {
      const actualHeight = measureContentHeight(textArea);
      const finalHeight =
        actualHeight < DEFAULT_HEIGHT ? DEFAULT_HEIGHT : actualHeight;
      textArea.style.height = finalHeight + "px";
      textBoxEl.style.height = finalHeight + TOOL_HEIGHT + "px";
    }
  }, [heightCalculations, measureContentHeight]);

  // 仅在值变化时运行效果，使用优化的清理
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // 发送消息处理
  const handleSendMessage = useCallback(async () => {
    const trimmedValue = value.trim();

    // 验证输入
    if (!trimmedValue) {
      message.warning('请输入消息内容');
      return;
    }

    if (isStreaming) {
      message.warning('AI正在回复中，请稍后再试');
      return;
    }

    if (!onSendMessage) {
      message.error('发送功能未配置');
      return;
    }

    try {
      // 清空输入框
      setValue("");

      // 重置高度
      if (textAreaRef.current && textBox.current) {
        textAreaRef.current.style.height = "";
        textBox.current.style.height = "";
      }

      // 调用发送消息回调
      await onSendMessage(trimmedValue);
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送失败，请重试');

      // 恢复输入框内容
      setValue(trimmedValue);
    }
  }, [value, isStreaming, onSendMessage]);

  // 停止流式回复
  const handleStopStreaming = useCallback(() => {
    if (onStopStreaming) {
      onStopStreaming();
    }
  }, [onStopStreaming]);

  // 键盘事件处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 处理Enter发送
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSendMessage();
    }

    // 处理Cmd+Enter换行
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      // 在当前光标位置插入换行符
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = value.substring(0, start) + '\n' + value.substring(end);

      setValue(newValue);

      // 设置光标位置到换行后
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 1;
      }, 0);
    }
  }, [handleSendMessage, isComposing, value]);

  // 清理定时器
  useEffect(() => {
    const timeoutId = inputTimeoutRef.current;
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <div className={styles.inputRoot} ref={textBox}>
      <textarea
        placeholder="Enter发送，Cmd+Enter换行"
        className={`${styles.inputContent} ${disabled ? styles.disabled : ''}`}
        ref={textAreaRef}
        value={value}
        autoFocus={true}
        disabled={disabled || isStreaming}
        onChange={(e) => setValue(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
      />
      <div className={styles.inputTool}>
        {isStreaming ? (
          <Button
            className={styles.toolItem}
            onClick={handleStopStreaming}
            size="small"
            shape="circle"
            danger
            title="停止回复"
          >
            停止
          </Button>
        ) : (
          <>
            <Button
              className={styles.toolItem}
              icon={<UploadOutlined />}
              size="small"
              shape="circle"
              disabled={disabled}
              title="上传文件"
            />
            <Button
              className={styles.toolItem}
              icon={<BookOutlined />}
              size="small"
              shape="circle"
              disabled={disabled}
              title="历史记录"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default SysInput;

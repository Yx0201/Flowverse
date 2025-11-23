"use client";

import styles from "./page.module.scss";

import { useState, useRef, useEffect, useCallback } from "react";
import useContentHeight from "@/app/(cilent)/hook/useContentHeight";
import BookOutlined from "@ant-design/icons/lib/icons/BookOutlined";
import UploadOutlined from "@ant-design/icons/lib/icons/UploadOutlined";
import { Button } from "antd";

interface SysInputProps {
  inputChange: (value: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onStopStreaming?: () => void;
}

const SysInput = ({
  inputChange,
  disabled = false,
  isStreaming = false,
  onStopStreaming
}: SysInputProps) => {
  'use memo'; // Opt-in for React Compiler optimization

  const [value, setValue] = useState("");
  const [isComposing, setIsComposing] = useState(false); // 跟踪中文输入法状态
  const lastKeyDownTime = useRef<number>(0); // 记录最后一次按键时间

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const textBox = useRef<HTMLDivElement>(null);

  const { measureContentHeight } = useContentHeight();

  // 安全地计算窗口相关的高度，避免在服务器端访问window
  const getSafeHeightCalculations = useCallback(() => {
    if (typeof window === 'undefined') {
      // 服务器端渲染时的默认值
      return { DEFAULT_HEIGHT: 120, TOOL_HEIGHT: 30 };
    }
    return {
      DEFAULT_HEIGHT: 0.16 * window.innerHeight + 15, //16vh + 15px padding
      TOOL_HEIGHT: 0.04 * window.innerHeight //4vh
    };
  }, []);

  const [heightCalculations, setHeightCalculations] = useState(getSafeHeightCalculations);

  // 在客户端挂载后更新高度计算
  useEffect(() => {
    setHeightCalculations(getSafeHeightCalculations());
  }, [getSafeHeightCalculations]);

  // Optimize the height adjustment logic with useCallback
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
      const finalHeight = actualHeight < DEFAULT_HEIGHT ? DEFAULT_HEIGHT : actualHeight;
      textArea.style.height = finalHeight + "px";
      textBoxEl.style.height = finalHeight + TOOL_HEIGHT + "px";
    }
  }, [heightCalculations, measureContentHeight]);

  // Only run effect when value changes, with optimized cleanup
  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Optimize event handlers with useCallback to prevent unnecessary re-renders
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!disabled) {
      setValue(e.target.value);
    }
  }, [disabled]);

  const handleCompositionStart = useCallback(() => {
    setIsComposing(true);
  }, []);

  const handleCompositionEnd = useCallback(() => {
    // 延迟一点时间设置isComposing为false，确保keydown事件处理完成
    setTimeout(() => {
      setIsComposing(false);
    }, 10);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const currentTime = Date.now();
    lastKeyDownTime.current = currentTime;

    // 处理Enter键事件
    if (e.key === "Enter") {
      // Command+Enter 或 Ctrl+Enter：换行
      if (e.metaKey || e.ctrlKey) {
        // 允许默认的换行行为
        return;
      }

      // 普通Enter：发送消息
      // 检查是否在中文输入法状态下
      if (isComposing) {
        // 在中文输入法状态下，阻止默认行为，等待输入完成
        e.preventDefault();
        return;
      }

      // 检查是否有选中的文本（中文输入法候选词状态）
      const selection = textAreaRef.current?.value?.slice(
        textAreaRef.current?.selectionStart || 0,
        textAreaRef.current?.selectionEnd || 0
      );

      // 如果有选中的文本且没有空格，可能是中文输入法的候选词
      if (selection && selection.length > 0 && !selection.includes(' ') && selection !== value.trim()) {
        e.preventDefault();
        return;
      }

      // 检查光标是否在单词中间（没有空格分隔）
      const textBeforeCursor = value.slice(0, textAreaRef.current?.selectionStart || 0);
      const textAfterCursor = value.slice(textAreaRef.current?.selectionEnd || 0);

      // 如果光标前后都没有空格，可能是在单词中间输入中文
      if (
        textBeforeCursor.length > 0 &&
        !textBeforeCursor.endsWith(' ') &&
        !textBeforeCursor.endsWith('\n') &&
        textAfterCursor.length > 0 &&
        !textAfterCursor.startsWith(' ') &&
        !textAfterCursor.startsWith('\n')
      ) {
        e.preventDefault();
        return;
      }

      // 所有检查通过，发送消息
      e.preventDefault();
      if (value.trim() && !disabled) {
        inputChange(value);
        setValue("");
      }
    }
  }, [isComposing, value, disabled, inputChange]);

  return (
    <div className={styles.inputRoot} ref={textBox}>
      <textarea
        placeholder={isStreaming ? "AI正在思考中..." : "开始对话... (Enter发送，Cmd+Enter换行)"}
        className={`${styles.inputContent} ${disabled ? styles.disabled : ''}`}
        ref={textAreaRef}
        value={value}
        onChange={handleInputChange}
        disabled={disabled}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onKeyDown={handleKeyDown}
        autoFocus={true}
      />
      <div className={styles.inputTool}>
        {isStreaming && onStopStreaming && (
          <Button
            className={styles.toolItem}
            onClick={onStopStreaming}
            size="small"
            danger
          >
            停止
          </Button>
        )}
        <Button
          className={styles.toolItem}
          icon={<UploadOutlined />}
          size="small"
          shape="circle"
          disabled={disabled}
        />
        <Button
          className={styles.toolItem}
          icon={<BookOutlined />}
          size="small"
          shape="circle"
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default SysInput;

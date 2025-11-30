// lib/ollamaService.ts (已修改为 Chat 模式)

// 定义 Ollama 要求的消息结构
export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// 定义 Ollama API 响应中的单个块结构
export interface OllamaChatResponseChunk {
  model: string;
  created_at: string;
  message: OllamaMessage & {
    thinking?: string; // 思考过程内容（当 think: true 时存在）
    tool_calls?: Array<{
      id: string;
      type: string;
      function: {
        name: string;
        arguments: Record<string, unknown>;
      };
    }>; // 工具调用（如果使用）
  }; // 这里的 message 包含 role, content, 和可选的 thinking
  done: boolean;
  // 其他可选字段...
}

/**
 * 核心函数：向 Ollama 的 /api/chat 发送请求并获取可读流。
 * @param messages 完整的聊天历史记录（包括系统指令和用户/助手消息）
 * @param signal AbortSignal 用于中止请求
 * @returns 一个 ReadableStream<Uint8Array>，包含来自 Ollama 的流式 JSON 响应。
 */
export async function getOllamaChatStream(
  messages: OllamaMessage[],
  signal?: AbortSignal
): Promise<ReadableStream<Uint8Array>> {
  const ollamaUrl = 'http://localhost:11434/api/chat';
  const modelName = 'qwen3:8b';

  try {
    // 创建一个带有超时的 fetch 请求
    const controller = new AbortController();
    if (signal) {
      signal.addEventListener('abort', () => {
        controller.abort();
      });
    }

    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Connection': 'keep-alive',
      },
      body: JSON.stringify({
        model: modelName,
        messages: messages,
        stream: true,
        think: true, // 启用thinking过程
        options: {
          temperature: 0.7,
          top_p: 0.9,
        }
      }),
      signal: controller.signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    // 创建一个新的流来处理错误和连接中断
    return new ReadableStream({
      start(controller) {
        const reader = response.body!.getReader();

        async function pump(): Promise<void> {
          try {
            while (true) {
              // 检查是否被中止
              if (signal?.aborted) {
                controller.close();
                return;
              }

              const { done, value } = await reader.read();

              if (done) {
                controller.close();
                return;
              }

              controller.enqueue(value);
            }
          } catch (error) {
            if (error instanceof Error && (
              error.name === 'AbortError' ||
              error.message.includes('aborted')
            )) {
              console.log('Ollama stream aborted');
              controller.close();
            } else {
              console.error('Ollama stream error:', error);
              controller.error(error);
            }
          }
        }

        pump();
      },
      cancel() {
        // 当流被取消时，中止读取
        controller.abort();
      }
    });

  } catch (error) {
    if (error instanceof Error && (
      error.name === 'AbortError' ||
      error.message.includes('aborted')
    )) {
      throw new Error('Request was aborted');
    }
    console.error('Error fetching from Ollama:', error);
    throw new Error('Failed to connect to the Ollama service.');
  }
}
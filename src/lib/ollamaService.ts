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
  message: OllamaMessage; // 这里的 message 包含 role 和 content
  done: boolean;
  // 其他可选字段...
}

/**
 * 核心函数：向 Ollama 的 /api/chat 发送请求并获取可读流。
 * @param messages 完整的聊天历史记录（包括系统指令和用户/助手消息）
 * @returns 一个 ReadableStream<Uint8Array>，包含来自 Ollama 的流式 JSON 响应。
 */
export async function getOllamaChatStream(messages: OllamaMessage[]): Promise<ReadableStream<Uint8Array>> {
  const ollamaUrl = 'http://localhost:11434/api/chat'; // 切换到 /api/chat 接口
  const modelName = 'qwen3:8b'; // 替换成你部署的实际模型名称

  try {
    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // 启用 stream: true
      body: JSON.stringify({
        model: modelName,
        messages: messages, // 传递完整的 messages 数组
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    // 直接返回底层的 ReadableStream
    return response.body;
  } catch (error) {
    console.error('Error fetching from Ollama:', error);
    throw new Error('Failed to connect to the Ollama service.');
  }
}
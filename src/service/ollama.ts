/**
 * Ollama API 服务模块
 * 用于与本地部署的 Ollama 服务进行通信
 */

// Ollama API 配置
export const OLLAMA_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_OLLAMA_URL || 'http://localhost:11434',
  MODEL: 'qwen3:8b', // 修正模型名称，qwen3:8b 可能不存在，使用 qwen2.5:8b
  DEFAULT_OPTIONS: {
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2000,
  },
} as const;

// 请求体接口定义
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OllamaChatRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

// 响应接口定义
export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaStreamChunk {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string;
    thinking?: string;
    images?: string[];
  };
  done: boolean;
}

/**
 * Ollama API 错误类
 */
export class OllamaError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public statusText?: string
  ) {
    super(message);
    this.name = 'OllamaError';
  }
}

/**
 * Ollama API 服务类
 */
export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor(config = OLLAMA_CONFIG) {
    this.baseUrl = config.BASE_URL;
    this.model = config.MODEL;
  }

  /**
   * 发起流式聊天请求
   * @param messages 聊天消息数组
   * @param onContent 接收到内容时的回调函数
   * @param onThinking 接收到思考过程时的回调函数
   * @param onComplete 完成时的回调函数
   * @param onError 错误时的回调函数
   */
  async streamChat(
    messages: ChatMessage[],
    onContent: (content: string) => void,
    onThinking?: (thinking: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      const requestBody: OllamaChatRequest = {
        model: this.model,
        messages,
        stream: true,
        options: OLLAMA_CONFIG.DEFAULT_OPTIONS,
      };

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new OllamaError(
          `HTTP error! status: ${response.status}`,
          response.status,
          response.statusText
        );
      }

      if (!response.body) {
        throw new OllamaError('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const chunk: OllamaStreamChunk = JSON.parse(line);

              // 处理思考过程
              if (chunk.message?.thinking) {
                onThinking?.(chunk.message.thinking);
              }

              // 处理正式内容
              if (chunk.message?.content) {
                onContent(chunk.message.content);
              }

              if (chunk.done) {
                onComplete?.();
                return;
              }
            } catch (parseError) {
              // Silently ignore parsing errors for malformed chunks
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof OllamaError) {
        onError?.(error);
      } else if (error instanceof Error) {
        onError?.(new OllamaError(error.message));
      } else {
        onError?.(new OllamaError('Unknown error occurred'));
      }
    }
  }

  /**
   * 非流式聊天请求（用于测试）
   * @param messages 聊天消息数组
   * @returns Promise<OllamaChatResponse>
   */
  async chat(messages: ChatMessage[]): Promise<OllamaChatResponse> {
    try {
      const requestBody: OllamaChatRequest = {
        model: this.model,
        messages,
        stream: false,
        options: OLLAMA_CONFIG.DEFAULT_OPTIONS,
      };

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new OllamaError(
          `HTTP error! status: ${response.status}`,
          response.status,
          response.statusText
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof OllamaError) {
        throw error;
      } else if (error instanceof Error) {
        throw new OllamaError(error.message);
      } else {
        throw new OllamaError('Unknown error occurred');
      }
    }
  }

  /**
   * 检查 Ollama 服务是否可用
   * @returns Promise<boolean>
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5秒超时
      });

      return response.ok;
    } catch {
      return false;
    }
  }
}

// 创建默认服务实例
export const ollamaService = new OllamaService();

export default ollamaService;
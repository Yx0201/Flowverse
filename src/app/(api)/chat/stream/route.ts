import { NextRequest, NextResponse } from "next/server";
import { ollamaService, ChatMessage, OllamaError } from "@/service/ollama";

// API响应接口定义
interface StreamApiResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  timestamp: string;
}

// 请求体接口定义
interface ChatStreamRequest {
  messages: ChatMessage[];
  model?: string;
  options?: {
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
  };
}

/**
 * 处理流式聊天API请求
 * @param request NextRequest对象
 * @returns Promise<Response> 流式响应
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // 验证Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return createErrorResponse("Content-Type必须是application/json", 415);
    }

    // 解析请求体
    const body = await request.json();
    const { messages, model, options } = body as ChatStreamRequest;

    // 验证请求数据
    const validationResult = validateStreamRequest(messages);
    if (!validationResult.isValid) {
      return createErrorResponse(validationResult.error!, 400);
    }

    // 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          await ollamaService.streamChat(
            messages,
            // onContent 回调
            (content: string) => {
              const chunk = {
                type: 'content',
                data: content,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            },
            // onThinking 回调
            (thinking: string) => {
              const thinkingChunk = {
                type: 'thinking',
                data: thinking,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(thinkingChunk)}\n\n`));
            },
            // onComplete 回调
            () => {
              const doneChunk = {
                type: 'done',
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneChunk)}\n\n`));
              controller.close();
            },
            // onError 回调
            (error: Error) => {
              const errorChunk = {
                type: 'error',
                message: error.message,
                timestamp: new Date().toISOString(),
              };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
              controller.close();
            }
          );
        } catch (error) {
          const errorChunk = {
            type: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });

  } catch (error) {

    if (error instanceof SyntaxError) {
      return createErrorResponse("请求体格式错误", 400);
    }

    return createErrorResponse("服务器内部错误", 500);
  }
}

/**
 * 处理OPTIONS请求（CORS预检）
 */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * 创建错误响应
 * @param message 错误消息
 * @param status HTTP状态码
 * @returns Response
 */
function createErrorResponse(message: string, status: number): Response {
  const response: StreamApiResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    }
  });
}

/**
 * 验证流式请求参数
 * @param messages 聊天消息数组
 * @returns 验证结果
 */
function validateStreamRequest(messages: unknown): { isValid: boolean; error?: string } {
  if (!messages || !Array.isArray(messages)) {
    return { isValid: false, error: "messages参数必须是数组" };
  }

  if (messages.length === 0) {
    return { isValid: false, error: "messages数组不能为空" };
  }

  // 验证每个消息的格式
  for (const [index, message] of messages.entries()) {
    if (!message || typeof message !== 'object') {
      return { isValid: false, error: `messages[${index}]必须是对象` };
    }

    const msg = message as ChatMessage;

    if (!msg.role || !['user', 'assistant', 'system'].includes(msg.role)) {
      return {
        isValid: false,
        error: `messages[${index}].role必须是'user'、'assistant'或'system'`
      };
    }

    if (!msg.content || typeof msg.content !== 'string') {
      return {
        isValid: false,
        error: `messages[${index}].content必须是字符串`
      };
    }

    if (msg.content.trim().length === 0) {
      return {
        isValid: false,
        error: `messages[${index}].content不能为空字符串`
      };
    }
  }

  return { isValid: true };
}
import { NextRequest, NextResponse } from "next/server";

// API响应接口定义
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
}

// 请求体接口定义
interface ChatRequest {
  data: string;
  [key: string]: unknown;
}

// 响应数据接口定义
interface ChatResponse {
  message: string;
  list: unknown[];
}

/**
 * 处理聊天API请求
 * @param request NextRequest对象
 * @returns Promise<NextResponse> API响应
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 验证Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return createErrorResponse("Content-Type必须是application/json", 415);
    }

    // 解析请求体
    const body = await request.json();

    // 验证请求数据
    const validationResult = validateRequest(body);
    if (!validationResult.isValid) {
      return createErrorResponse(validationResult.error!, 400);
    }

    const { data } = body as ChatRequest;

    // 处理业务逻辑
    const responseData: ChatResponse = {
      message: `请求成功，接收到的数据: ${data}`,
      list: [],
    };

    return createSuccessResponse(responseData, "请求处理成功");

  } catch (error) {

    // 处理不同类型的错误
    if (error instanceof SyntaxError) {
      return createErrorResponse("请求体格式错误", 400);
    }

    return createErrorResponse("服务器内部错误", 500);
  }
}

/**
 * 创建成功响应
 * @param data 响应数据
 * @param message 响应消息
 * @returns NextResponse
 */
function createSuccessResponse<T>(data: T, message: string = "Success"): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    }
  });
}

/**
 * 创建错误响应
 * @param message 错误消息
 * @param status HTTP状态码
 * @returns NextResponse
 */
function createErrorResponse(message: string, status: number): NextResponse {
  const response: ApiResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(response, {
    status,
    headers: {
      "Content-Type": "application/json",
    }
  });
}

/**
 * 验证请求数据
 * @param body 请求体
 * @returns 验证结果
 */
function validateRequest(body: unknown): { isValid: boolean; error?: string } {
  if (!body || typeof body !== "object") {
    return { isValid: false, error: "请求体不能为空" };
  }

  const { data } = body as ChatRequest;

  if (!data) {
    return { isValid: false, error: "缺少必需的data参数" };
  }

  if (typeof data !== "string") {
    return { isValid: false, error: "data参数必须是字符串类型" };
  }

  if (data.trim().length === 0) {
    return { isValid: false, error: "data参数不能为空字符串" };
  }

  return { isValid: true };
}

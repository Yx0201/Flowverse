/**
 * 认证相关的工具函数
 */

// 定义登录状态接口
export interface LoginState {
  isLoggedIn: boolean;
  username?: string;
  loginTime?: number;
}

// 模拟用户数据
const MOCK_USERS = [
  {
    username: 'yangxiao',
    password: '123456'
  }
];

// Cookie名称
export const AUTH_COOKIE_NAME = 'auth_token';

/**
 * 验证用户登录
 * @param username 用户名
 * @param password 密码
 * @returns 验证结果
 */
export function validateUser(username: string, password: string): boolean {
  const user = MOCK_USERS.find(u => u.username === username && u.password === password);
  return !!user;
}

/**
 * 创建认证token（简单模拟）
 * @param username 用户名
 * @returns token字符串
 */
export function createAuthToken(username: string): string {
  const payload = {
    username,
    loginTime: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24小时过期
  };
  return btoa(JSON.stringify(payload)); // 简单的base64编码
}

/**
 * 验证认证token
 * @param token token字符串
 * @returns 解析后的登录状态
 */
export function verifyAuthToken(token: string): LoginState | null {
  try {
    const payload = JSON.parse(atob(token));

    // 检查token是否过期
    if (Date.now() > payload.exp) {
      return null;
    }

    return {
      isLoggedIn: true,
      username: payload.username,
      loginTime: payload.loginTime
    };
  } catch {
    return null;
  }
}

/**
 * 从请求中获取认证状态
 * @param request Next.js请求对象
 * @returns 登录状态
 */
export async function getAuthStatus(request: Request): Promise<LoginState> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) {
    return { isLoggedIn: false };
  }

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split('=');
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);

  const token = cookies[AUTH_COOKIE_NAME];
  if (!token) {
    return { isLoggedIn: false };
  }

  const authState = verifyAuthToken(token);
  return authState || { isLoggedIn: false };
}

/**
 * 从服务器组件中获取认证状态（使用Next.js cookies函数）
 * @returns 登录状态
 */
export async function getAuthStatusFromServer(): Promise<LoginState> {
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return { isLoggedIn: false };
    }

    const authState = verifyAuthToken(token);
    return authState || { isLoggedIn: false };
  } catch (error) {
    // 生产环境中避免详细错误日志，开发环境中记录
    if (process.env.NODE_ENV === 'development') {
      console.error('Error getting auth status from server:', error);
    }
    return { isLoggedIn: false };
  }
}
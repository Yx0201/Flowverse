/**
 * 客户端认证相关工具函数
 */

import { AUTH_COOKIE_NAME } from './auth';

/**
 * 设置认证token到cookie
 * @param token 认证token
 */
export function setAuthCookie(token: string): void {
  if (typeof window !== 'undefined') {
    document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/; max-age=${24 * 60 * 60}; secure=${process.env.NODE_ENV === 'production'}; samesite=strict`;

    // 触发自定义事件，通知AuthWrapper状态已更改
    window.dispatchEvent(new CustomEvent('auth-changed', {
      detail: { type: 'login', token }
    }));
  }
}

/**
 * 清除认证cookie
 */
export function clearAuthCookie(): void {
  if (typeof window !== 'undefined') {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

    // 触发自定义事件，通知AuthWrapper状态已更改
    window.dispatchEvent(new CustomEvent('auth-changed', {
      detail: { type: 'logout' }
    }));
  }
}

/**
 * 获取当前的认证token
 * @returns token字符串或null
 */
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);

    return cookies[AUTH_COOKIE_NAME] || null;
  }
  return null;
}

/**
 * 执行登出操作
 */
export function logout(): void {
  clearAuthCookie();
  // 清除旧的sessionStorage数据
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('user');
  }
}
/**
 * 调试工具模块
 * 根据环境变量控制日志输出
 */

const isDebugMode = process.env.NEXT_PUBLIC_DEBUG === 'true' && process.env.NODE_ENV === 'development';

export const debug = {
  log: (...args: any[]) => {
    if (isDebugMode) {
      console.log('[DEBUG]', ...args);
    }
  },

  error: (...args: any[]) => {
    if (isDebugMode) {
      console.error('[ERROR]', ...args);
    } else {
      // 生产环境只记录严重错误
      console.error('[APP ERROR]');
    }
  },

  warn: (...args: any[]) => {
    if (isDebugMode) {
      console.warn('[WARN]', ...args);
    }
  },

  info: (...args: any[]) => {
    if (isDebugMode) {
      console.info('[INFO]', ...args);
    }
  }
};
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthStatus } from "@/lib/auth";

//白名单
const publicRoutes = ["/login"];

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 过滤静态资源请求
  if (
    path.startsWith('/api/') ||
    path.startsWith('/_next/') ||
    path.startsWith('/favicon.') ||
    path.includes('.')
  ) {
    return NextResponse.next();
  }

  // 1. 是否白名单
  const isPublicRoute = publicRoutes.some((route) => path === route);

  // 2. 获取用户认证状态
  const authStatus = await getAuthStatus(request);
  const isAuthenticated = authStatus.isLoggedIn;

  if (isPublicRoute) {
    return NextResponse.next();
  }

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// 使用简单的matcher，让proxy函数处理过滤逻辑
export const config = {
  matcher: [
    // 匹配所有路径，在proxy函数内部进行过滤
    '/(.*)',
  ],
};

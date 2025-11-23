"use client";

import { usePathname } from 'next/navigation';
import { ReactNode, useMemo } from 'react';
import SysNav from './SysNav/page';

interface SysNavWrapperProps {
  children?: ReactNode;
}

const SysNavWrapper = ({ children }: SysNavWrapperProps) => {
  const pathname = usePathname();

  // 使用useMemo优化路径比较，避免每次渲染都重新计算
  const shouldShowNav = useMemo(() => pathname !== '/login', [pathname]);

  return (
    <>
      {shouldShowNav && <SysNav />}
      {children}
    </>
  );
};

export default SysNavWrapper;
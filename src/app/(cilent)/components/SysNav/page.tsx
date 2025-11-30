"use client";

import { memo, useCallback, useMemo } from "react";
import styles from "./page.module.scss";
import { logout } from "@/lib/client-auth";
import { App } from "antd";
import { useRouter } from "next/navigation";

const SysNav = () => {
  'use memo'; // Opt-in for React Compiler optimization
  const router = useRouter();
  const { message } = App.useApp();

  const handleLogout = useCallback(async () => {
    try {
      logout();
      message.success('Logged out successfully');

      // 等待消息显示后重定向到登录页
      setTimeout(() => {
        router.push('/login');
      }, 1000);
    } catch {
      message.error('Logout failed');
    }
  }, [router, message]);

  const handleNavClick = useCallback((item: string) => {
    switch (item) {
      case 'Chat':
        router.push('/talk');
        break;
      case 'Knowledge':
        router.push('/knowledge');
        break;
      case 'Agent':
        message.info('Agent feature coming soon');
        break;
      case 'Github':
        window.open('https://github.com/Yx0201/Flowverse', '_blank');
        break;
      case 'Logout':
        handleLogout();
        break;
      default:
        break;
    }
  }, [router, message, handleLogout]);

  const navItems = useMemo(() => [
    'Chat',
    'Knowledge',
    'Agent',
    'Logout',
    'Github'
  ], []);

  return (
    <div className={styles.navRoot}>
      {navItems.map((item) => (
        <span
          key={item}
          className={styles.navItem}
          onClick={() => handleNavClick(item)}
          style={{
            cursor: 'pointer',
            color: item === 'Logout' ? '#ff4d4f' : 'inherit'
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
};

export default memo(SysNav);

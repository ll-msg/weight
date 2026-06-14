"use client";

// 路由守卫：未登录自动跳转到登录页；加载中显示占位。

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="center">
        <div style={{ fontSize: 32 }}>⏳</div>
        <div className="muted">加载中…</div>
      </div>
    );
  }
  if (!user) return null;
  return <>{children}</>;
}

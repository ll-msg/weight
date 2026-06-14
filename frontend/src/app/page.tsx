"use client";

// 首页：根据登录状态跳转到赛季列表或登录页。

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/seasons" : "/login");
  }, [user, loading, router]);

  return (
    <div className="center">
      <div style={{ fontSize: 40 }}>⚖️</div>
      <div className="page-title">减肥对抗赛</div>
      <div className="muted">正在进入…</div>
    </div>
  );
}

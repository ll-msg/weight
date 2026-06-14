"use client";

// 登录页。

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(username.trim(), password);
      router.replace("/seasons");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="text-center" style={{ margin: "28px 0 20px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <h1 className="page-title" style={{ margin: "12px 0 4px" }}>
          减肥对抗赛
        </h1>
        <div className="subtitle">登录开始你的健康对决</div>
      </div>

      <form className="card" onSubmit={onSubmit}>
        {error && <div className="error">{error}</div>}
        <div className="field">
          <label>用户名</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="field">
          <label>密码</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "登录中…" : "登录"}
        </button>
      </form>

      <p className="text-center muted" style={{ fontSize: 14 }}>
        还没有账号？ <Link href="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>立即注册</Link>
      </p>
    </div>
  );
}

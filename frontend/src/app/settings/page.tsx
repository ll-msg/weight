"use client";

// 设置页：修改密码、退出登录。

import Link from "next/link";
import { Suspense, useState } from "react";

import BottomNav from "@/components/BottomNav";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function SettingsInner() {
  const { user, logout } = useAuth();

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (newPwd.length < 4) {
      setMsg({ type: "err", text: "新密码至少 4 位" });
      return;
    }
    if (newPwd !== confirmPwd) {
      setMsg({ type: "err", text: "两次输入的新密码不一致" });
      return;
    }
    if (newPwd === oldPwd) {
      setMsg({ type: "err", text: "新密码不能与当前密码相同" });
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(oldPwd, newPwd);
      setMsg({ type: "ok", text: "密码已修改 ✅" });
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "修改失败" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="flex-between" style={{ marginTop: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          设置
        </h1>
        <Link href="/seasons" className="btn btn-secondary btn-sm">
          返回
        </Link>
      </div>

      <div className="card">
        <div className="card-title">账号</div>
        <div className="muted" style={{ fontSize: 13 }}>
          当前用户：{user?.profile?.display_name}（{user?.username}）
        </div>
      </div>

      <form className="card" onSubmit={onSubmit}>
        <div className="card-title">修改密码</div>
        {msg && <div className={msg.type === "ok" ? "success" : "error"}>{msg.text}</div>}

        <div className="field">
          <label>当前密码</label>
          <input
            type="password"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="field">
          <label>新密码（至少 4 位）</label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
            minLength={4}
            autoComplete="new-password"
          />
        </div>
        <div className="field">
          <label>确认新密码</label>
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
            minLength={4}
            autoComplete="new-password"
          />
        </div>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "提交中…" : "保存新密码"}
        </button>
      </form>

      <button className="btn btn-secondary" onClick={logout}>
        退出登录
      </button>

      <BottomNav />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="center muted">加载中…</div>}>
        <SettingsInner />
      </Suspense>
    </RequireAuth>
  );
}

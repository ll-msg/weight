"use client";

// 设置页：修改密码、退出登录。

import Link from "next/link";
import { Suspense, useState } from "react";

import BottomNav from "@/components/BottomNav";
import LangToggle from "@/components/LangToggle";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

function SettingsInner() {
  const { user, logout } = useAuth();
  const { t } = useI18n();

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (newPwd.length < 4) {
      setMsg({ type: "err", text: t("settings.pwdTooShort") });
      return;
    }
    if (newPwd !== confirmPwd) {
      setMsg({ type: "err", text: t("settings.mismatch") });
      return;
    }
    if (newPwd === oldPwd) {
      setMsg({ type: "err", text: t("settings.sameAsOld") });
      return;
    }
    setBusy(true);
    try {
      await api.changePassword(oldPwd, newPwd);
      setMsg({ type: "ok", text: t("settings.changed") });
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : t("settings.changeFail") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="flex-between" style={{ marginTop: 12 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t("settings.title")}
        </h1>
        <div style={{ display: "flex", gap: 8 }}>
          <LangToggle />
          <Link href="/seasons" className="btn btn-secondary btn-sm">
            {t("common.back")}
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card-title">{t("settings.account")}</div>
        <div className="muted" style={{ fontSize: 13 }}>
          {t("settings.currentUser")}: {user?.profile?.display_name} ({user?.username})
        </div>
      </div>

      <form className="card" onSubmit={onSubmit}>
        <div className="card-title">{t("settings.changePassword")}</div>
        {msg && <div className={msg.type === "ok" ? "success" : "error"}>{msg.text}</div>}

        <div className="field">
          <label>{t("settings.currentPwd")}</label>
          <input
            type="password"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <div className="field">
          <label>{t("settings.newPwd")}</label>
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
          <label>{t("settings.confirmPwd")}</label>
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
          {busy ? t("settings.saving") : t("settings.savePwd")}
        </button>
      </form>

      <button className="btn btn-secondary" onClick={logout}>
        {t("settings.logout")}
      </button>

      <BottomNav />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="center muted">…</div>}>
        <SettingsInner />
      </Suspense>
    </RequireAuth>
  );
}

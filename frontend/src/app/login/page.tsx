"use client";

// 登录页。

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import GameTitle from "@/components/GameTitle";
import LangToggle from "@/components/LangToggle";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
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
      setError(err instanceof Error ? err.message : t("login.fail"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="container"
      style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}
    >
      {/* 中英文切换：放在最初始界面右上角 */}
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <LangToggle />
      </div>

      <div className="text-center" style={{ margin: "8px 0 20px" }}>
        <GameTitle />
        <div className="subtitle">{t("login.subtitle")}</div>
      </div>

      <form className="card" onSubmit={onSubmit} style={{ width: "100%" }}>
        {error && <div className="error">{error}</div>}
        <div className="field">
          <label>{t("login.username")}</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="field">
          <label>{t("login.password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? t("login.submitting") : t("login.submit")}
        </button>
      </form>

      <p className="text-center muted" style={{ fontSize: 14 }}>
        {t("login.noAccount")}{" "}
        <Link href="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>
          {t("login.register")}
        </Link>
      </p>
    </div>
  );
}

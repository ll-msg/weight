"use client";

// 注册页：创建账号 + 填写基础资料。

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Avatar from "@/components/Avatar";
import LangToggle from "@/components/LangToggle";
import { useAuth } from "@/lib/auth";
import { AVATAR_OPTIONS, DEFAULT_AVATAR } from "@/lib/avatars";
import { useI18n } from "@/lib/i18n";
import type { ProfileInput } from "@/lib/types";

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState<ProfileInput>({
    display_name: "",
    gender: "other",
    birth_date: null,
    height_cm: 170,
    starting_weight_kg: 70,
    target_weight_kg: 65,
    activity_level: "light",
    avatar: DEFAULT_AVATAR,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(username.trim(), password, profile);
      router.replace("/seasons");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("register.fail"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="flex-between" style={{ marginTop: 16 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          {t("register.title")}
        </h1>
        <LangToggle />
      </div>

      <form onSubmit={onSubmit}>
        {error && <div className="error">{error}</div>}

        <div className="card">
          <div className="card-title">{t("register.account")}</div>
          <div className="field">
            <label>{t("login.username")}</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={2} />
          </div>
          <div className="field">
            <label>{t("login.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={4}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-title">{t("register.profile")}</div>

          <div className="field">
            <label>{t("register.displayName")}</label>
            <input
              value={profile.display_name}
              onChange={(e) => update("display_name", e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>{t("register.avatar")}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {AVATAR_OPTIONS.map((a) => (
                <button
                  type="button"
                  key={a.key}
                  title={a.label}
                  onClick={() => update("avatar", a.key)}
                  className="avatar-circle"
                  style={{
                    cursor: "pointer",
                    border:
                      profile.avatar === a.key ? "2px solid var(--primary)" : "2px solid var(--ink)",
                  }}
                >
                  <Avatar value={a.key} size={24} />
                </button>
              ))}
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>{t("register.gender")}</label>
              <select value={profile.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="male">{t("gender.male")}</option>
                <option value="female">{t("gender.female")}</option>
                <option value="other">{t("gender.other")}</option>
              </select>
            </div>
            <div className="field">
              <label>{t("register.birthday")}</label>
              <input
                type="date"
                value={profile.birth_date ?? ""}
                onChange={(e) => update("birth_date", e.target.value || null)}
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>{t("register.height")}</label>
              <input
                type="number"
                step="0.1"
                value={profile.height_cm}
                onChange={(e) => update("height_cm", parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="field">
              <label>{t("register.activity")}</label>
              <select
                value={profile.activity_level}
                onChange={(e) => update("activity_level", e.target.value)}
              >
                <option value="sedentary">{t("activity.sedentary")}</option>
                <option value="light">{t("activity.light")}</option>
                <option value="moderate">{t("activity.moderate")}</option>
                <option value="active">{t("activity.active")}</option>
              </select>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>{t("register.startWeight")}</label>
              <input
                type="number"
                step="0.1"
                value={profile.starting_weight_kg}
                onChange={(e) => update("starting_weight_kg", parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="field">
              <label>{t("register.targetWeight")}</label>
              <input
                type="number"
                step="0.1"
                value={profile.target_weight_kg ?? ""}
                onChange={(e) =>
                  update("target_weight_kg", e.target.value ? parseFloat(e.target.value) : null)
                }
              />
            </div>
          </div>
        </div>

        <button className="btn btn-primary" disabled={busy}>
          {busy ? t("register.submitting") : t("register.submit")}
        </button>
      </form>

      <p className="text-center muted" style={{ fontSize: 14 }}>
        {t("register.haveAccount")}{" "}
        <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
          {t("register.login")}
        </Link>
      </p>
    </div>
  );
}

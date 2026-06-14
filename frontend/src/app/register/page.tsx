"use client";

// 注册页：创建账号 + 填写基础资料。

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import Avatar from "@/components/Avatar";
import { useAuth } from "@/lib/auth";
import { AVATAR_OPTIONS, DEFAULT_AVATAR } from "@/lib/avatars";
import type { ProfileInput } from "@/lib/types";

export default function RegisterPage() {
  const { register } = useAuth();
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
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <h1 className="page-title" style={{ marginTop: 16 }}>
        创建账号
      </h1>

      <form onSubmit={onSubmit}>
        {error && <div className="error">{error}</div>}

        <div className="card">
          <div className="card-title">账号</div>
          <div className="field">
            <label>用户名</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={2} />
          </div>
          <div className="field">
            <label>密码</label>
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
          <div className="card-title">基础资料</div>

          <div className="field">
            <label>昵称</label>
            <input
              value={profile.display_name}
              onChange={(e) => update("display_name", e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>头像</label>
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
              <label>性别</label>
              <select value={profile.gender} onChange={(e) => update("gender", e.target.value)}>
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div className="field">
              <label>生日</label>
              <input
                type="date"
                value={profile.birth_date ?? ""}
                onChange={(e) => update("birth_date", e.target.value || null)}
              />
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>身高 (cm)</label>
              <input
                type="number"
                step="0.1"
                value={profile.height_cm}
                onChange={(e) => update("height_cm", parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="field">
              <label>活动水平</label>
              <select
                value={profile.activity_level}
                onChange={(e) => update("activity_level", e.target.value)}
              >
                <option value="sedentary">久坐</option>
                <option value="light">轻度活动</option>
                <option value="moderate">中度活动</option>
                <option value="active">高强度活动</option>
              </select>
            </div>
          </div>

          <div className="row">
            <div className="field">
              <label>初始体重 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={profile.starting_weight_kg}
                onChange={(e) => update("starting_weight_kg", parseFloat(e.target.value))}
                required
              />
            </div>
            <div className="field">
              <label>目标体重 (kg)</label>
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
          {busy ? "创建中…" : "注册并进入"}
        </button>
      </form>

      <p className="text-center muted" style={{ fontSize: 14 }}>
        已有账号？ <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>去登录</Link>
      </p>
    </div>
  );
}

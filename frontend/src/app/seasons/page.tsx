"use client";

// 赛季页：问候 + 创建赛季 + 我的赛季列表。

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import Avatar from "@/components/Avatar";
import BottomNav from "@/components/BottomNav";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Season, UserBrief } from "@/lib/types";
import { todayStr } from "@/lib/utils";

function SeasonsInner() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [users, setUsers] = useState<UserBrief[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);

  // 创建表单状态
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(todayStr());
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [myBaseline, setMyBaseline] = useState<number>(user?.profile?.starting_weight_kg ?? 70);
  const [opponentId, setOpponentId] = useState<number | "">("");
  const [opponentBaseline, setOpponentBaseline] = useState<number>(70);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([api.listSeasons(), api.listUsers()]);
      setSeasons(s);
      setUsers(u.filter((x) => x.id !== user?.id)); // 候选对手（排除自己）
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 选择对手后，默认用其初始体重作为基数
  useEffect(() => {
    if (opponentId === "") return;
    const opp = users.find((u) => u.id === opponentId);
    if (opp?.profile) setOpponentBaseline(opp.profile.starting_weight_kg);
  }, [opponentId, users]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (opponentId === "") {
      setError("请选择一位对手");
      return;
    }
    setBusy(true);
    try {
      const season = await api.createSeason({
        name: name.trim(),
        start_date: startDate,
        duration_weeks: durationWeeks,
        participants: [
          { user_id: user!.id, baseline_weight_kg: myBaseline },
          { user_id: opponentId, baseline_weight_kg: opponentBaseline },
        ],
      });
      router.push(`/dashboard?season=${season.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="flex-between" style={{ marginTop: 12 }}>
        <div>
          <div className="muted" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
            你好 <Avatar value={user?.profile?.avatar} size={16} />
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {user?.profile?.display_name}
          </h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/settings"
            className="btn btn-secondary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
            title="设置"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ui/IconGear.png" alt="设置" style={{ height: 14, imageRendering: "pixelated" }} />
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            退出
          </button>
        </div>
      </div>

      {/* 创建赛季 */}
      {!showCreate ? (
        <button className="btn btn-primary mb" onClick={() => setShowCreate(true)}>
          + 创建新赛季
        </button>
      ) : (
        <form className="card" onSubmit={onCreate}>
          <div className="card-title">创建赛季</div>
          {error && <div className="error">{error}</div>}

          <div className="field">
            <label>赛季名称</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：夏日燃脂战" required />
          </div>

          <div className="row">
            <div className="field">
              <label>开始日期</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="field">
              <label>时长（周）</label>
              <input
                type="number"
                min={1}
                max={52}
                value={durationWeeks}
                onChange={(e) => setDurationWeeks(parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>我的基数体重 (kg)</label>
            <input
              type="number"
              step="0.1"
              value={myBaseline}
              onChange={(e) => setMyBaseline(parseFloat(e.target.value))}
              required
            />
          </div>

          <div className="field">
            <label>对手</label>
            <select
              value={opponentId}
              onChange={(e) => setOpponentId(e.target.value ? parseInt(e.target.value) : "")}
              required
            >
              <option value="">选择对手…</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.profile?.display_name ?? u.username}
                </option>
              ))}
            </select>
          </div>

          {opponentId !== "" && (
            <div className="field">
              <label>对手基数体重 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={opponentBaseline}
                onChange={(e) => setOpponentBaseline(parseFloat(e.target.value))}
                required
              />
            </div>
          )}

          <div className="row">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>
              取消
            </button>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "创建中…" : "创建并开始"}
            </button>
          </div>
          {users.length === 0 && (
            <p className="muted text-center" style={{ fontSize: 13, marginTop: 10 }}>
              还没有其他用户可作为对手，先去注册一个对手账号吧。
            </p>
          )}
        </form>
      )}

      {/* 赛季列表 */}
      <h2 className="card-title" style={{ marginTop: 8 }}>
        我的赛季
      </h2>
      {loading ? (
        <p className="muted">加载中…</p>
      ) : seasons.length === 0 ? (
        <p className="muted">还没有赛季，创建一个开始对抗吧！</p>
      ) : (
        seasons.map((s) => (
          <Link key={s.id} href={`/dashboard?season=${s.id}`} className="list-item">
            <div>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {s.start_date} ~ {s.end_date} · {s.duration_weeks} 周
              </div>
              <div style={{ marginTop: 4 }}>
                {s.participants.map((p) => (
                  <span
                    key={p.id}
                    style={{ marginRight: 8, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 3 }}
                  >
                    <Avatar value={p.user?.profile?.avatar} size={14} />{" "}
                    {p.user?.profile?.display_name ?? p.user?.username}
                  </span>
                ))}
              </div>
            </div>
            <span className={`badge ${s.is_finished ? "badge-gray" : "badge-green"}`}>
              {s.is_finished ? "已结束" : "进行中"}
            </span>
          </Link>
        ))
      )}

      <BottomNav />
    </div>
  );
}

export default function SeasonsPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="center muted">加载中…</div>}>
        <SeasonsInner />
      </Suspense>
    </RequireAuth>
  );
}

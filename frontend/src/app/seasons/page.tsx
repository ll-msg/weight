"use client";

// 赛季页：问候 + 创建赛季 + 我的赛季列表。

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import Avatar from "@/components/Avatar";
import BottomNav from "@/components/BottomNav";
import RequireAuth from "@/components/RequireAuth";
import ResultModal from "@/components/ResultModal";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { CompetitionResult, Season, UserBrief } from "@/lib/types";
import { todayStr } from "@/lib/utils";

// 该赛季的结算弹窗是否已看过（每个赛季只自动弹一次）
const seenKey = (id: number) => `lw_seen_result_${id}`;

function SeasonsInner() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [seasons, setSeasons] = useState<Season[]>([]);
  const [users, setUsers] = useState<UserBrief[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resultModal, setResultModal] = useState<CompetitionResult | null>(null);

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

      // 赛季刚结束且尚未看过结算 → 弹出胜负战报特效
      const justEnded = s.find(
        (se) =>
          se.is_finished &&
          se.participants.some((p) => p.user_id === user?.id) &&
          !localStorage.getItem(seenKey(se.id)),
      );
      if (justEnded) {
        try {
          setResultModal(await api.getCompetition(justEnded.id));
        } catch {
          /* 忽略 */
        }
      }
    } catch {
      /* 列表拉取失败：不崩溃，保持空列表 */
    } finally {
      setLoading(false);
    }
  }

  // 关闭结算弹窗（标记已看过）
  function dismissResult() {
    if (resultModal) localStorage.setItem(seenKey(resultModal.season_id), "1");
    setResultModal(null);
  }
  // 查看总结 → 跳到战报/总结页
  function viewSummary() {
    if (!resultModal) return;
    localStorage.setItem(seenKey(resultModal.season_id), "1");
    router.push(`/report?season=${resultModal.season_id}`);
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

  // 申请/同意/撤销「提前结束」——需双方都同意才真正结束
  async function onEndAction(e: React.MouseEvent, s: Season) {
    e.preventDefault(); // 阻止 Link 跳转
    e.stopPropagation();
    const me = s.participants.find((p) => p.user_id === user?.id);
    const opp = s.participants.find((p) => p.user_id !== user?.id);
    try {
      let updated: Season;
      if (me?.wants_end) {
        // 我已申请 → 点击撤销
        if (!window.confirm(t("seasons.confirmCancelEnd", { name: s.name }))) return;
        updated = await api.cancelEndSeason(s.id);
      } else {
        // 对方已申请 → 同意；否则 → 发起申请
        const key = opp?.wants_end ? "seasons.confirmAgree" : "seasons.confirmEnd";
        if (!window.confirm(t(key, { name: s.name }))) return;
        updated = await api.requestEndSeason(s.id);
      }
      setSeasons((list) => list.map((x) => (x.id === s.id ? updated : x)));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t("seasons.endFail"));
    }
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (opponentId === "") {
      setError(t("seasons.pickOpponent"));
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
      setError(err instanceof Error ? err.message : t("seasons.createFail"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container">
      <div className="flex-between" style={{ marginTop: 12 }}>
        <div>
          <div className="muted" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
            {t("seasons.hello")} <Avatar value={user?.profile?.avatar} size={16} />
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
            title={t("seasons.settings")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ui/IconGear.png" alt={t("seasons.settings")} style={{ height: 14, imageRendering: "pixelated" }} />
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={logout}>
            {t("common.logout")}
          </button>
        </div>
      </div>

      {/* 创建赛季 */}
      {!showCreate ? (
        <button className="btn btn-primary mb" onClick={() => setShowCreate(true)}>
          {t("seasons.createNew")}
        </button>
      ) : (
        <form className="card" onSubmit={onCreate}>
          <div className="card-title">{t("seasons.createTitle")}</div>
          {error && <div className="error">{error}</div>}

          <div className="field">
            <label>{t("seasons.name")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("seasons.namePlaceholder")} required />
          </div>

          <div className="row">
            <div className="field">
              <label>{t("seasons.startDate")}</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="field">
              <label>{t("seasons.duration")}</label>
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
            <label>{t("seasons.myBaseline")}</label>
            <input
              type="number"
              step="0.1"
              value={myBaseline}
              onChange={(e) => setMyBaseline(parseFloat(e.target.value))}
              required
            />
          </div>

          <div className="field">
            <label>{t("seasons.opponent")}</label>
            <select
              value={opponentId}
              onChange={(e) => setOpponentId(e.target.value ? parseInt(e.target.value) : "")}
              required
            >
              <option value="">{t("seasons.selectOpponent")}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.profile?.display_name ?? u.username}
                </option>
              ))}
            </select>
          </div>

          {opponentId !== "" && (
            <div className="field">
              <label>{t("seasons.oppBaseline")}</label>
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
              {t("common.cancel")}
            </button>
            <button className="btn btn-primary" disabled={busy}>
              {busy ? t("seasons.creating") : t("seasons.create")}
            </button>
          </div>
          {users.length === 0 && (
            <p className="muted text-center" style={{ fontSize: 13, marginTop: 10 }}>
              {t("seasons.noUsers")}
            </p>
          )}
        </form>
      )}

      {/* 赛季列表 */}
      <h2 className="card-title" style={{ marginTop: 8 }}>
        {t("seasons.mySeasons")}
      </h2>
      {loading ? (
        <p className="muted">{t("common.loading")}</p>
      ) : seasons.length === 0 ? (
        <p className="muted">{t("seasons.empty")}</p>
      ) : (
        seasons.map((s) => (
          <Link
            key={s.id}
            href={`${s.is_finished ? "/report" : "/dashboard"}?season=${s.id}`}
            className="list-item"
          >
            <div>
              <div style={{ fontWeight: 600 }}>{s.name}</div>
              <div className="muted" style={{ fontSize: 12 }}>
                {s.start_date} ~ {s.end_date} · {t("seasons.weeksShort", { n: s.duration_weeks })}
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <span className={`badge ${s.is_finished ? "badge-gray" : "badge-green"}`}>
                {s.is_finished ? t("seasons.finished") : t("seasons.ongoing")}
              </span>
              {s.is_finished ? (
                <span style={{ color: "var(--red-dark)", fontWeight: 700, fontSize: 13 }}>
                  {t("seasons.summary")} ›
                </span>
              ) : (
                (() => {
                  const me = s.participants.find((p) => p.user_id === user?.id);
                  const opp = s.participants.find((p) => p.user_id !== user?.id);
                  const label = me?.wants_end
                    ? t("seasons.waitingOther")
                    : opp?.wants_end
                      ? t("seasons.agreeEnd")
                      : t("seasons.end");
                  return (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={(e) => onEndAction(e, s)}
                    >
                      {label}
                    </button>
                  );
                })()
              )}
            </div>
          </Link>
        ))
      )}

      {resultModal && user && (
        <ResultModal
          result={resultModal}
          currentUserId={user.id}
          onClose={dismissResult}
          onViewSummary={viewSummary}
        />
      )}

      <BottomNav />
    </div>
  );
}

export default function SeasonsPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="center muted">…</div>}>
        <SeasonsInner />
      </Suspense>
    </RequireAuth>
  );
}

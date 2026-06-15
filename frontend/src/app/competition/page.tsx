"use client";

// 对抗界面：左=当前玩家，右=对手。对比当日数据 + 累计得分。

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import Avatar from "@/components/Avatar";
import BottomNav from "@/components/BottomNav";
import CompareRow from "@/components/CompareRow";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { CompetitionResult, DailyRecord, Participant, Season } from "@/lib/types";
import { todayStr } from "@/lib/utils";

function PlayerHead({
  p,
  isMe,
  isLeader,
  side,
}: {
  p?: Participant;
  isMe: boolean;
  isLeader: boolean;
  side: "left" | "right";
}) {
  const { t } = useI18n();
  // 左右各坐一页书页（TravelBookLite 的左/右页）
  const page = side === "left" ? "/ui/BookPageLeft01a.png" : "/ui/BookPageRight01a.png";
  return (
    <div
      style={{
        textAlign: "center",
        flex: 1,
        padding: "14px 8px 16px",
        backgroundImage: `url(${page})`,
        backgroundSize: "100% 100%",
        imageRendering: "pixelated",
      }}
    >
      <div className="avatar-circle" style={{ margin: "0 auto", width: 48, height: 48, fontSize: 24 }}>
        <Avatar value={p?.user?.profile?.avatar} size={28} />
      </div>
      <div style={{ fontWeight: 700, marginTop: 4 }}>
        {p?.user?.profile?.display_name ?? p?.user?.username ?? "—"}
      </div>
      <div style={{ display: "flex", gap: 4, justifyContent: "center", marginTop: 2 }}>
        {isMe && <span className="badge badge-green">{t("competition.me")}</span>}
        {isLeader && (
          <span className="badge badge-gold" style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ui/IconStar01a.png" alt="" style={{ height: 11, imageRendering: "pixelated" }} />{" "}
            {t("competition.leading")}
          </span>
        )}
      </div>
    </div>
  );
}

function CompetitionInner() {
  const { user } = useAuth();
  const { t } = useI18n();
  const params = useSearchParams();
  const seasonId = Number(params.get("season"));

  const [season, setSeason] = useState<Season | null>(null);
  const [result, setResult] = useState<CompetitionResult | null>(null);
  const [date, setDate] = useState(todayStr());
  const [leftRec, setLeftRec] = useState<DailyRecord | null>(null);
  const [rightRec, setRightRec] = useState<DailyRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // 确定左右两位参赛者：左=我，右=对手
  const me = season?.participants.find((p) => p.user_id === user?.id) ?? season?.participants[0];
  const opp = season?.participants.find((p) => p.user_id !== me?.user_id) ?? season?.participants[1];

  useEffect(() => {
    if (!seasonId) return;
    Promise.all([api.getSeason(seasonId), api.getCompetition(seasonId)])
      .then(([s, r]) => {
        setSeason(s);
        setResult(r);
      })
      .catch(() => {});
  }, [seasonId]);

  // 加载当日双方记录
  const loadDay = useCallback(async () => {
    if (!seasonId || !me || !opp) return;
    setLoading(true);
    try {
      const [l, r] = await Promise.all([
        api.getDay(seasonId, date, me.user_id),
        api.getDay(seasonId, date, opp.user_id),
      ]);
      setLeftRec(l);
      setRightRec(r);
    } catch {
      // 非参与者/网络错误：不崩溃
      setLeftRec(null);
      setRightRec(null);
    } finally {
      setLoading(false);
    }
  }, [seasonId, date, me, opp]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  if (!seasonId) {
    return (
      <div className="container">
        <div className="center">{t("dashboard.pickSeason")}</div>
        <BottomNav />
      </div>
    );
  }

  const scoreOf = (uid?: number) => result?.scores.find((s) => s.user_id === uid);
  const leftScore = scoreOf(me?.user_id);
  const rightScore = scoreOf(opp?.user_id);
  const leaderId = result?.winner_user_id;

  const mealsText = (rec: DailyRecord | null) =>
    rec && rec.meals.length
      ? rec.meals.map((m) => `${t(`meal.${m.meal_type}`)}: ${m.description}`)
      : null;

  return (
    <div className="container">
      <div className="muted" style={{ fontSize: 13, marginTop: 12 }}>
        {season?.name}
      </div>
      <h1 className="page-title" style={{ margin: "0 0 12px" }}>
        ⚔️ {t("competition.title")}
      </h1>

      {result?.is_finished && (
        <div
          className="mb"
          style={{
            background: "var(--stone)",
            color: "var(--ink)",
            border: "3px solid var(--ink)",
            padding: "8px 12px",
            fontSize: 13,
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          {t("ended.title")}
        </div>
      )}

      {/* 选手头像 */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "stretch" }}>
          <PlayerHead
            p={me}
            side="left"
            isMe={me?.user_id === user?.id}
            isLeader={!result?.is_tie && leaderId === me?.user_id}
          />
          <div
            style={{
              alignSelf: "center",
              fontWeight: 800,
              fontSize: 18,
              color: "var(--red-dark)",
              padding: "0 4px",
            }}
          >
            VS
          </div>
          <PlayerHead
            p={opp}
            side="right"
            isMe={opp?.user_id === user?.id}
            isLeader={!result?.is_tie && leaderId === opp?.user_id}
          />
        </div>
      </div>

      {/* 累计总分 */}
      <div className="card">
        <div className="card-title">{t("competition.totalScore")}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center" }}>
          <div className="text-center">
            <div style={{ fontSize: 30, fontWeight: 800, color: "var(--primary)" }}>
              {leftScore?.total_score ?? "—"}
            </div>
          </div>
          <div className="muted">{t("competition.points")}</div>
          <div className="text-center">
            <div style={{ fontSize: 30, fontWeight: 800, color: "var(--accent)" }}>
              {rightScore?.total_score ?? "—"}
            </div>
          </div>
        </div>

        {/* 累计分项与减重 */}
        {leftScore && rightScore && (
          <div className="mt">
            <CompareRow label={t("competition.lossKg")} left={leftScore.total_loss_kg} right={rightScore.total_loss_kg} better="higher" />
            <CompareRow label={t("competition.lossPct")} left={leftScore.total_loss_pct} right={rightScore.total_loss_pct} better="higher" unit="%" />
            <CompareRow label={t("competition.weightScore")} left={leftScore.weight_score} right={rightScore.weight_score} better="higher" />
            <CompareRow label={t("competition.stabilityScore")} left={leftScore.stability_score} right={rightScore.stability_score} better="higher" />
            <CompareRow label={t("competition.daysLogged")} left={leftScore.days_logged} right={rightScore.days_logged} better="higher" />
            <CompareRow label={t("competition.daysExercised")} left={leftScore.days_exercised} right={rightScore.days_exercised} better="higher" />
            <CompareRow label={t("competition.healthyWeeks")} left={leftScore.healthy_weeks} right={rightScore.healthy_weeks} better="higher" />
            <CompareRow label={t("competition.overWeeks")} left={leftScore.over_limit_weeks} right={rightScore.over_limit_weeks} better="none" />
          </div>
        )}
      </div>

      {/* 当日对比 */}
      <div className="card">
        <div className="flex-between" style={{ marginBottom: 8 }}>
          <div className="card-title" style={{ margin: 0 }}>
            {t("competition.todayData")}
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: "auto", padding: "6px 10px" }}
          />
        </div>
        {loading ? (
          <p className="muted">{t("common.loading")}</p>
        ) : (
          <>
            <CompareRow label={t("competition.weightRow")} left={leftRec?.weight_kg ?? null} right={rightRec?.weight_kg ?? null} better="none" />
            <CompareRow label={t("competition.waterRow")} left={leftRec?.water_ml ?? null} right={rightRec?.water_ml ?? null} better="higher" />
            <CompareRow label={t("competition.exerciseRow")} left={leftRec?.exercise_minutes ?? null} right={rightRec?.exercise_minutes ?? null} better="higher" />
            <CompareRow label={t("competition.kcalRow")} left={leftRec?.exercise_kcal ?? null} right={rightRec?.exercise_kcal ?? null} better="higher" />
            <CompareRow label={t("competition.stepsRow")} left={leftRec?.steps ?? null} right={rightRec?.steps ?? null} better="higher" />
            <CompareRow label={t("competition.sleepRow")} left={leftRec?.sleep_hours ?? null} right={rightRec?.sleep_hours ?? null} better="none" />

            {/* 食谱对比 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{t("competition.myMeals")}</div>
                {mealsText(leftRec)?.map((tx, i) => (
                  <div key={i} style={{ fontSize: 13 }}>
                    {tx}
                  </div>
                )) ?? <div className="muted" style={{ fontSize: 13 }}>{t("common.none")}</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{t("competition.oppMeals")}</div>
                {mealsText(rightRec)?.map((tx, i) => (
                  <div key={i} style={{ fontSize: 13 }}>
                    {tx}
                  </div>
                )) ?? <div className="muted" style={{ fontSize: 13 }}>{t("common.none")}</div>}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

export default function CompetitionPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="center muted">…</div>}>
        <CompetitionInner />
      </Suspense>
    </RequireAuth>
  );
}

"use client";

// 战报页：展示赛季战报卡片，支持保存为图片到本地相册。

import { toPng } from "html-to-image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import BottomNav from "@/components/BottomNav";
import ReportCard from "@/components/ReportCard";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { CompetitionResult, Season } from "@/lib/types";

// 单个统计小格
function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <div className="val">{value}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}

function ReportInner() {
  const { t } = useI18n();
  const { user } = useAuth();
  const params = useSearchParams();
  const seasonId = Number(params.get("season"));

  const [season, setSeason] = useState<Season | null>(null);
  const [result, setResult] = useState<CompetitionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [page, setPage] = useState(0); // 0=战报，1=健康总结

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!seasonId) return;
    Promise.all([api.getSeason(seasonId), api.getCompetition(seasonId)])
      .then(([s, r]) => {
        setSeason(s);
        setResult(r);
      })
      .catch(() => {
        /* 拉取失败：保持空数据，下方显示「暂无战报数据」 */
      })
      .finally(() => setLoading(false));
  }, [seasonId]);

  // 导出战报为 PNG 图片并下载（移动端即保存到相册）
  async function onSave() {
    if (!cardRef.current) return;
    setSaving(true);
    setMsg("");
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2, // 高清
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `report-${season?.name ?? "season"}.png`;
      link.href = dataUrl;
      link.click();
      setMsg(t("report.saved"));
    } catch (err) {
      setMsg(err instanceof Error ? `${t("report.saveFail")}: ${err.message}` : t("report.saveFail"));
    } finally {
      setSaving(false);
    }
  }

  if (!seasonId) {
    return (
      <div className="container">
        <div className="center">{t("dashboard.pickSeason")}</div>
        <BottomNav />
      </div>
    );
  }

  const me = result?.scores.find((s) => s.user_id === user?.id);

  return (
    <div className="container">
      <h1 className="page-title" style={{ marginTop: 12 }}>
        {t("summary.pageTitle")}
      </h1>

      {!result?.is_finished && <p className="subtitle mb">{t("report.notFinished")}</p>}

      {loading ? (
        <p className="muted">{t("common.loading")}</p>
      ) : season && result ? (
        <>
          {/* 翻页器：战报 ⇄ 健康总结 */}
          <div className="flex-between mb">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(0)}
              disabled={page === 0}
              aria-label={t("summary.tabReport")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ui/IconArrow.png" alt="" style={{ height: 12, transform: "scaleX(-1)", imageRendering: "pixelated" }} />
            </button>
            <div style={{ fontWeight: 700, fontSize: 14 }}>
              {page === 0 ? t("summary.tabReport") : t("summary.tabHealth")}
              <span className="muted" style={{ fontWeight: 400 }}> ({page + 1}/2)</span>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPage(1)}
              disabled={page === 1}
              aria-label={t("summary.tabHealth")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/ui/IconArrow.png" alt="" style={{ height: 12, imageRendering: "pixelated" }} />
            </button>
          </div>

          {page === 0 ? (
            // —— 第 1 页：双方战报 ——
            <>
              <ReportCard ref={cardRef} season={season} result={result} />
              {msg && <div className="success mt">{msg}</div>}
              <button className="btn btn-primary mt" onClick={onSave} disabled={saving}>
                {saving ? t("report.generating") : t("report.save")}
              </button>
              <p className="muted text-center" style={{ fontSize: 12, marginTop: 8 }}>
                {t("report.saveHint")}
              </p>
            </>
          ) : (
            // —— 第 2 页：我的健康总结 ——
            me && (
              <div className="card">
                <div className="card-title">{t("summary.myHealth")}</div>
                <div className="stat-grid">
                  <StatTile label={t("summary.totalLoss")} value={`${me.total_loss_kg} kg`} />
                  <StatTile label={t("summary.lossPct")} value={`${me.total_loss_pct}%`} />
                  <StatTile label={t("summary.daysLogged")} value={`${me.days_logged} ${t("summary.unitDays")}`} />
                  <StatTile label={t("summary.daysExercised")} value={`${me.days_exercised} ${t("summary.unitDays")}`} />
                  <StatTile label={t("summary.waterGoalDays")} value={`${me.days_water_goal} ${t("summary.unitDays")}`} />
                  <StatTile label={t("summary.totalWater")} value={`${(me.total_water_ml / 1000).toFixed(1)} L`} />
                  <StatTile label={t("summary.totalExercise")} value={`${me.total_exercise_minutes} ${t("summary.unitMin")}`} />
                  <StatTile label={t("summary.mealsLogged")} value={`${me.total_meals_logged}`} />
                  <StatTile label={t("summary.healthyWeeks")} value={`${me.healthy_weeks} ${t("summary.unitWeeks")}`} />
                  <StatTile label={t("summary.overWeeks")} value={`${me.over_limit_weeks} ${t("summary.unitWeeks")}`} />
                </div>
              </div>
            )
          )}
        </>
      ) : (
        <p className="muted">{t("report.noData")}</p>
      )}

      <BottomNav />
    </div>
  );
}

export default function ReportPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="center muted">…</div>}>
        <ReportInner />
      </Suspense>
    </RequireAuth>
  );
}

"use client";

// 赛季战报卡片（可导出为图片保存到相册）。
// 像素「手账」风：羊皮纸底、深棕描边；赢家一侧金色高亮 + 冠军标识。
// 注意：导出走 html-to-image，这里全部用纯色/纯边框（不用 border-image），保证截图稳定。

import { forwardRef } from "react";

import Avatar from "@/components/Avatar";
import { useI18n } from "@/lib/i18n";
import type { CompetitionResult, ScoreBreakdown, Season } from "@/lib/types";

// 主题色（与 globals.css 一致）
const C = {
  ink: "#493333",
  parchment: "#ffd7a8",
  parchmentDark: "#f0c890",
  winnerBg: "#ffe7ad",
  gold: "#b8860b",
  goldBright: "#ffd071",
  red: "#9c4351",
  muted: "#8a6a4e",
  divider: "#d9b98a",
};

interface Props {
  season: Season;
  result: CompetitionResult;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 13,
        padding: "5px 0",
        borderTop: `1px solid ${C.divider}`,
      }}
    >
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function PlayerColumn({
  score,
  isWinner,
  finished,
}: {
  score: ScoreBreakdown;
  isWinner: boolean;
  finished: boolean;
}) {
  const { t } = useI18n();
  const unit = (v: string | number, u: string) => `${v}${u ? " " + u : ""}`;
  return (
    <div
      style={{
        flex: 1,
        padding: 12,
        background: isWinner ? C.winnerBg : C.parchment,
        border: isWinner ? `3px solid ${C.gold}` : `3px solid ${C.parchmentDark}`,
        color: C.ink,
      }}
    >
      {isWinner && (
        <div style={{ textAlign: "center", lineHeight: 1, marginBottom: 2 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ui/IconStar01a.png" alt="" style={{ height: 20, imageRendering: "pixelated" }} />
        </div>
      )}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 32, lineHeight: 1 }}>
          <Avatar value={score.user?.profile?.avatar} size={34} />
        </div>
        <div style={{ fontWeight: 700 }}>
          {score.user?.profile?.display_name ?? score.user?.username}
        </div>
        {isWinner && (
          <div
            style={{
              display: "inline-block",
              marginTop: 4,
              padding: "2px 10px",
              background: C.gold,
              color: "#fff7e0",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {finished ? t("report.champion") : t("report.leadingNow")}
          </div>
        )}
      </div>

      <div style={{ textAlign: "center", margin: "10px 0" }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: isWinner ? C.gold : C.red }}>
          {score.total_score}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>{t("report.cTotalScore")}</div>
      </div>

      <Stat label={t("report.cLoss")} value={unit(score.total_loss_kg, t("report.unitKg"))} />
      <Stat label={t("report.cLossPct")} value={`${score.total_loss_pct}%`} />
      <Stat label={t("report.cBaseline")} value={`${score.baseline_weight_kg} → ${score.latest_weight_kg ?? "—"}`} />
      <Stat label={t("report.cDaysLogged")} value={unit(score.days_logged, t("report.unitDays"))} />
      <Stat label={t("report.cDaysEx")} value={unit(score.days_exercised, t("report.unitDays"))} />
      <Stat label={t("report.cWaterGoal")} value={unit(score.days_water_goal, t("report.unitDays"))} />
      <Stat label={t("report.cMeals")} value={unit(score.total_meals_logged, t("report.unitMeals"))} />
      <Stat label={t("report.cHealthyWeeks")} value={unit(score.healthy_weeks, t("report.unitWeeks"))} />
    </div>
  );
}

const ReportCard = forwardRef<HTMLDivElement, Props>(function ReportCard({ season, result }, ref) {
  const { t, lang } = useI18n();
  const winnerId = result.winner_user_id;
  const winnerName = result.scores.find((s) => s.user_id === winnerId)?.user?.profile?.display_name;
  return (
    <div
      ref={ref}
      style={{
        background: C.parchment,
        border: `4px solid ${C.ink}`,
        padding: 16,
        color: C.ink,
        fontFamily: '"Zpix", "PingFang SC", "Microsoft YaHei", ui-monospace, monospace',
      }}
    >
      {/* 标题 */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: C.red, fontWeight: 700 }}>{t("report.cardHeader")}</div>
        <div style={{ fontSize: 20, fontWeight: 800, marginTop: 2 }}>{season.name}</div>
        <div style={{ fontSize: 12, color: C.muted }}>
          {season.start_date} ~ {season.end_date} · {t("report.totalWeeks", { n: season.duration_weeks })}
        </div>
        <div style={{ marginTop: 6 }}>
          {result.is_tie ? (
            <span style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{t("report.tie")}</span>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>
              🏆 {result.is_finished ? t("report.finalChampion") : t("report.currentLeader")}: {winnerName}
            </span>
          )}
        </div>
      </div>

      {/* 双方对比 */}
      <div style={{ display: "flex", gap: 10 }}>
        {result.scores.map((s) => (
          <PlayerColumn
            key={s.user_id}
            score={s}
            isWinner={!result.is_tie && s.user_id === winnerId}
            finished={result.is_finished}
          />
        ))}
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: C.muted, marginTop: 12 }}>
        {t("report.footer")} · {new Date().toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US")}
      </div>
    </div>
  );
});

export default ReportCard;

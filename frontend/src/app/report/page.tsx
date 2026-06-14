"use client";

// 战报页：展示赛季战报卡片，支持保存为图片到本地相册。

import { toPng } from "html-to-image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import BottomNav from "@/components/BottomNav";
import ReportCard from "@/components/ReportCard";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { CompetitionResult, Season } from "@/lib/types";

function ReportInner() {
  const { t } = useI18n();
  const params = useSearchParams();
  const seasonId = Number(params.get("season"));

  const [season, setSeason] = useState<Season | null>(null);
  const [result, setResult] = useState<CompetitionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!seasonId) return;
    Promise.all([api.getSeason(seasonId), api.getCompetition(seasonId)])
      .then(([s, r]) => {
        setSeason(s);
        setResult(r);
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

  return (
    <div className="container">
      <h1 className="page-title" style={{ marginTop: 12 }}>
        {t("report.title")}
      </h1>

      {!result?.is_finished && <p className="subtitle mb">{t("report.notFinished")}</p>}

      {loading ? (
        <p className="muted">{t("common.loading")}</p>
      ) : season && result ? (
        <>
          {/* 可导出的战报卡片 */}
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

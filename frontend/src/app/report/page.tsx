"use client";

// 战报页：展示赛季战报卡片，支持保存为图片到本地相册。

import { toPng } from "html-to-image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import BottomNav from "@/components/BottomNav";
import ReportCard from "@/components/ReportCard";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import type { CompetitionResult, Season } from "@/lib/types";

function ReportInner() {
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
      link.download = `战报-${season?.name ?? "season"}.png`;
      link.href = dataUrl;
      link.click();
      setMsg("已生成图片，请在弹出的保存对话框中保存到相册 📸");
    } catch (err) {
      setMsg(err instanceof Error ? `保存失败：${err.message}` : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  if (!seasonId) {
    return (
      <div className="container">
        <div className="center">请先从赛季列表选择当前赛季</div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title" style={{ marginTop: 12 }}>
        赛季战报
      </h1>

      {!result?.is_finished && (
        <p className="subtitle mb">赛季尚未结束，以下为实时战况预览。</p>
      )}

      {loading ? (
        <p className="muted">加载中…</p>
      ) : season && result ? (
        <>
          {/* 可导出的战报卡片 */}
          <ReportCard ref={cardRef} season={season} result={result} />

          {msg && <div className="success mt">{msg}</div>}

          <button className="btn btn-primary mt" onClick={onSave} disabled={saving}>
            {saving ? "生成中…" : "保存战报到相册"}
          </button>
          <p className="muted text-center" style={{ fontSize: 12, marginTop: 8 }}>
            手机端可长按图片或在下载提示中「存储到相册」
          </p>
        </>
      ) : (
        <p className="muted">暂无战报数据</p>
      )}

      <BottomNav />
    </div>
  );
}

export default function ReportPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="center muted">加载中…</div>}>
        <ReportInner />
      </Suspense>
    </RequireAuth>
  );
}

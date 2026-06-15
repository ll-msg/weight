"use client";

// 主界面：记录某赛季某天的体重、喝水、运动、睡眠、心情、备注、食谱。

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import BottomNav from "@/components/BottomNav";
import MealsEditor from "@/components/MealsEditor";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import type { Meal, Season } from "@/lib/types";
import { bmi, bmiKey, todayStr } from "@/lib/utils";

// 带像素图标的分区标题
function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="icon-lg" src={`/ui/${icon}.png`} alt="" /> {children}
    </div>
  );
}

// 表单初始空状态
const emptyForm = {
  weight_kg: "" as number | "",
  water_ml: 0,
  exercise_minutes: 0,
  exercise_kcal: 0,
  steps: 0,
  sleep_hours: "" as number | "",
  mood: null as number | null,
  notes: "",
  meals: [] as Meal[],
};

function DashboardInner() {
  const { user } = useAuth();
  const { t } = useI18n();
  const params = useSearchParams();
  const seasonId = Number(params.get("season"));

  const [season, setSeason] = useState<Season | null>(null);
  const [date, setDate] = useState(todayStr());
  const [form, setForm] = useState({ ...emptyForm });
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // 加载赛季信息
  useEffect(() => {
    if (!seasonId) return;
    api.getSeason(seasonId).then(setSeason).catch(() => setSeason(null));
  }, [seasonId]);

  // 加载指定日期的记录（用于回填）
  const loadDay = useCallback(async () => {
    if (!seasonId) return;
    // 赛季已结束则不拉取记录（页面会显示已结束提示）
    if (season?.is_finished) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rec = await api.getDay(seasonId, date);
      if (rec) {
        setForm({
          weight_kg: rec.weight_kg ?? "",
          water_ml: rec.water_ml,
          exercise_minutes: rec.exercise_minutes,
          exercise_kcal: rec.exercise_kcal,
          steps: rec.steps,
          sleep_hours: rec.sleep_hours ?? "",
          mood: rec.mood,
          notes: rec.notes ?? "",
          meals: rec.meals.map((m) => ({ ...m })),
        });
      } else {
        setForm({ ...emptyForm });
      }
    } catch {
      // 例如非参与者(403)/网络错误：不崩溃，回退为空表单
      setForm({ ...emptyForm });
    } finally {
      setLoading(false);
    }
  }, [seasonId, date, season?.is_finished]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSave() {
    setMsg(null);
    setBusy(true);
    try {
      await api.upsertRecord({
        season_id: seasonId,
        record_date: date,
        weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
        water_ml: form.water_ml,
        exercise_minutes: form.exercise_minutes,
        exercise_kcal: form.exercise_kcal,
        steps: form.steps,
        sleep_hours: form.sleep_hours === "" ? null : Number(form.sleep_hours),
        mood: form.mood,
        notes: form.notes || null,
        meals: form.meals.filter((m) => m.description.trim()),
      });
      setMsg({ type: "ok", text: t("dashboard.saved") });
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : t("dashboard.saveFail") });
    } finally {
      setBusy(false);
    }
  }

  if (!seasonId) {
    return (
      <div className="container">
        <div className="center">
          <div>{t("dashboard.pickSeason")}</div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // 赛季已结束：禁止记录，提示并引导去看总结
  if (season?.is_finished) {
    return (
      <div className="container">
        <div className="center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ui/IconStar01a.png" alt="" style={{ height: 32, imageRendering: "pixelated" }} />
          <div className="page-title" style={{ margin: 0 }}>
            {t("ended.title")}
          </div>
          <div className="muted">{t("ended.desc")}</div>
          <Link
            href={`/report?season=${seasonId}`}
            className="btn btn-primary"
            style={{ width: "auto" }}
          >
            {t("result.viewSummary")}
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const height = user?.profile?.height_cm ?? 170;
  const curWeight = form.weight_kg === "" ? null : Number(form.weight_kg);
  const curBmi = curWeight ? bmi(curWeight, height) : null;

  return (
    <div className="container">
      <div className="flex-between" style={{ marginTop: 12 }}>
        <div>
          <div className="muted" style={{ fontSize: 13 }}>
            {season?.name ?? t("dashboard.season")}
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {t("dashboard.todayLog")}
          </h1>
        </div>
      </div>

      {/* 日期选择 */}
      <div className="card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label>{t("dashboard.recordDate")}</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      {msg && <div className={msg.type === "ok" ? "success" : "error"}>{msg.text}</div>}

      {loading ? (
        <p className="muted">{t("common.loading")}</p>
      ) : (
        <>
          {/* 体重 */}
          <div className="card">
            <SectionTitle icon="weight">{t("dashboard.weight")}</SectionTitle>
            <div className="field" style={{ marginBottom: 8 }}>
              <input
                type="number"
                step="0.1"
                placeholder="kg"
                value={form.weight_kg}
                onChange={(e) => set("weight_kg", e.target.value === "" ? "" : parseFloat(e.target.value))}
              />
            </div>
            {curBmi && (
              <div className="muted" style={{ fontSize: 13 }}>
                BMI {curBmi.toFixed(1)} ({t(`bmi.${bmiKey(curBmi)}`)})
              </div>
            )}
          </div>

          {/* 喝水 */}
          <div className="card">
            <SectionTitle icon="water">
              {t("dashboard.water")}: {form.water_ml} ml
            </SectionTitle>
            <div className="row">
              {[200, 250, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => set("water_ml", form.water_ml + amt)}
                >
                  +{amt}
                </button>
              ))}
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => set("water_ml", 0)}>
                {t("dashboard.clear")}
              </button>
            </div>
          </div>

          {/* 运动 */}
          <div className="card">
            <SectionTitle icon="exercise">{t("dashboard.exercise")}</SectionTitle>
            <div className="row">
              <div className="field">
                <label>{t("dashboard.exDuration")}</label>
                <input
                  type="number"
                  value={form.exercise_minutes}
                  onChange={(e) => set("exercise_minutes", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="field">
                <label>{t("dashboard.exKcal")}</label>
                <input
                  type="number"
                  value={form.exercise_kcal}
                  onChange={(e) => set("exercise_kcal", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>{t("dashboard.steps")}</label>
              <input
                type="number"
                value={form.steps}
                onChange={(e) => set("steps", parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* 睡眠 & 心情 */}
          <div className="card">
            <SectionTitle icon="sleep">{t("dashboard.sleepMood")}</SectionTitle>
            <div className="field">
              <label>{t("dashboard.sleepHours")}</label>
              <input
                type="number"
                step="0.5"
                value={form.sleep_hours}
                onChange={(e) => set("sleep_hours", e.target.value === "" ? "" : parseFloat(e.target.value))}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>
                {t("dashboard.mood")}
                {form.mood ? ` (${form.mood}/5)` : ""}
              </label>
              {/* 暗红底小条：选中的星金色「亮起」，未选中为暗淡星影 */}
              <div
                style={{
                  display: "inline-flex",
                  gap: 8,
                  background: "var(--maroon)",
                  border: "2px solid var(--ink)",
                  padding: "6px 10px",
                }}
              >
                {[1, 2, 3, 4, 5].map((m) => {
                  const filled = (form.mood ?? 0) >= m;
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-label={`mood ${m}`}
                      onClick={() => set("mood", form.mood === m ? null : m)}
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/ui/IconStar01a.png"
                        alt=""
                        style={{
                          height: 26,
                          imageRendering: "pixelated",
                          display: "block",
                          opacity: filled ? 1 : 0.28,
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 食谱 */}
          <div className="card">
            <SectionTitle icon="food">{t("dashboard.food")}</SectionTitle>
            <MealsEditor meals={form.meals} onChange={(meals) => set("meals", meals)} />
          </div>

          {/* 备注 */}
          <div className="card">
            <SectionTitle icon="notes">{t("dashboard.notes")}</SectionTitle>
            <textarea
              placeholder={t("dashboard.notesPlaceholder")}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <button className="btn btn-primary" onClick={onSave} disabled={busy}>
            {busy ? t("dashboard.saving") : t("dashboard.saveDay")}
          </button>
        </>
      )}

      <BottomNav />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="center muted">…</div>}>
        <DashboardInner />
      </Suspense>
    </RequireAuth>
  );
}

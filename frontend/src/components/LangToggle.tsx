"use client";

// 中英文切换按钮：像素地球图标 + 目标语言文字，沿用像素主题（次按钮样式）。

import { useI18n } from "@/lib/i18n";

export default function LangToggle() {
  const { lang, toggle } = useI18n();
  return (
    <button
      type="button"
      onClick={toggle}
      className="btn btn-secondary btn-sm"
      style={{ display: "inline-flex", alignItems: "center", gap: 6, width: "auto" }}
      title={lang === "zh" ? "Switch to English" : "切换为中文"}
      aria-label="language"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/ui/globe.png" alt="" style={{ height: 16, imageRendering: "pixelated" }} />
      {/* 显示「将切换到的目标语言」 */}
      {lang === "zh" ? "EN" : "中"}
    </button>
  );
}

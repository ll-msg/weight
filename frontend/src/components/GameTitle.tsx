"use client";

// 游戏 logo 风格的标题 banner（两行，像素厚描边 + 金色渐变 + 立体投影）。
// 文案走 i18n，中英文自动适配。

import { useI18n } from "@/lib/i18n";

export default function GameTitle() {
  const { t } = useI18n();
  return (
    <div className="game-title" aria-label={t("common.appName")}>
      <span className="game-title-line">{t("common.appNameLine1")}</span>
      <span className="game-title-line">{t("common.appNameLine2")}</span>
    </div>
  );
}

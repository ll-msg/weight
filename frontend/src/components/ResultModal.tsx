"use client";

// 赛季结算弹窗：胜利 / 惜败 / 平局，像素主题 + 星星掉落特效。

import Avatar from "@/components/Avatar";
import { useI18n } from "@/lib/i18n";
import type { CompetitionResult } from "@/lib/types";

interface Props {
  result: CompetitionResult;
  currentUserId: number;
  onClose: () => void;
  onViewSummary: () => void;
}

// 胜利时的像素星星掉落
function Confetti() {
  const stars = Array.from({ length: 12 });
  return (
    <>
      {stars.map((_, i) => {
        const left = (i * 8.3 + (i % 3) * 4) % 100;
        const delay = (i % 6) * 0.4;
        const dur = 2.4 + (i % 4) * 0.6;
        const size = 10 + (i % 3) * 6;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            className="confetti"
            src="/ui/IconStar01a.png"
            alt=""
            style={{ left: `${left}%`, width: size, animationDelay: `${delay}s`, animationDuration: `${dur}s` }}
          />
        );
      })}
    </>
  );
}

export default function ResultModal({ result, currentUserId, onClose, onViewSummary }: Props) {
  const { t } = useI18n();
  const me = result.scores.find((s) => s.user_id === currentUserId);
  const opp = result.scores.find((s) => s.user_id !== currentUserId);

  const outcome: "win" | "lose" | "tie" = result.is_tie
    ? "tie"
    : result.winner_user_id === currentUserId
      ? "win"
      : "lose";

  const bannerText = t(`result.${outcome}`);
  const descText = t(`result.${outcome}Desc`);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="card modal-card" onClick={(e) => e.stopPropagation()}>
        {outcome === "win" && <Confetti />}

        <div style={{ position: "relative", zIndex: 2 }}>
          {/* 顶部图标：胜利金星 / 平局握手 / 惜败暗星 */}
          <div style={{ fontSize: 28, lineHeight: 1 }}>
            {outcome === "win" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/ui/IconStar01a.png" alt="" style={{ height: 30, imageRendering: "pixelated" }} />
            ) : outcome === "tie" ? (
              "🤝"
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/ui/IconStar01e.png" alt="" style={{ height: 30, imageRendering: "pixelated" }} />
            )}
          </div>

          <div className={`result-banner ${outcome}`}>{bannerText}</div>
          <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>
            {descText}
          </div>

          {/* 双方比分 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: 14 }}>
            <div>
              <Avatar value={me?.user?.profile?.avatar} size={26} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                {me?.user?.profile?.display_name ?? me?.user?.username}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--red-dark)" }}>
                {me?.total_score ?? "—"}
              </div>
            </div>
            <div className="muted" style={{ fontWeight: 800, padding: "0 6px" }}>VS</div>
            <div>
              <Avatar value={opp?.user?.profile?.avatar} size={26} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                {opp?.user?.profile?.display_name ?? opp?.user?.username}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--accent)" }}>
                {opp?.total_score ?? "—"}
              </div>
            </div>
          </div>

          <button className="btn btn-primary" onClick={onViewSummary}>
            {t("result.viewSummary")}
          </button>
          <button className="btn btn-ghost" style={{ marginTop: 6 }} onClick={onClose}>
            {t("result.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

// 对抗对比行：左值 | 标签 | 右值，可按「越大越好」高亮领先一方。

interface Props {
  label: string;
  left: number | string | null;
  right: number | string | null;
  // 比较方向：higher = 越大越好；none = 不分胜负
  better?: "higher" | "none";
  unit?: string;
}

export default function CompareRow({ label, left, right, better = "none", unit = "" }: Props) {
  const ln = typeof left === "number" ? left : null;
  const rn = typeof right === "number" ? right : null;

  let leftWin = false;
  let rightWin = false;
  if (better === "higher" && ln !== null && rn !== null && ln !== rn) {
    leftWin = ln > rn;
    rightWin = rn > ln;
  }

  const fmt = (v: number | string | null) => (v === null || v === "" ? "—" : `${v}${unit}`);
  const winStyle = { color: "var(--primary)", fontWeight: 700 };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div style={{ textAlign: "left", ...(leftWin ? winStyle : {}) }}>{fmt(left)}</div>
      <div className="muted" style={{ fontSize: 12, padding: "0 10px", whiteSpace: "nowrap" }}>
        {label}
      </div>
      <div style={{ textAlign: "right", ...(rightWin ? winStyle : {}) }}>{fmt(right)}</div>
    </div>
  );
}

"use client";

// 头像渲染：已知 key → 像素图标 <img>；否则回退为文字/emoji（兼容旧数据）。

import { avatarSrc } from "@/lib/avatars";

export default function Avatar({ value, size = 22 }: { value?: string | null; size?: number }) {
  const src = avatarSrc(value);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <span
        style={{ 
          fontSize: size,
          lineHeight: `${size}px`,
          verticalAlign: "middle", 
          display: "inline-block" 
        }}
      >
        {src}
      </span>
    );
  }
  return <span style={{ fontSize: size, lineHeight: 1 }}>{value || "👤"}</span>;
}

// 像素头像集合（来自 TravelBookLite 图标）。
// 头像以「key」形式存储在用户资料里，渲染时映射到对应精灵图。

export interface AvatarOption {
  key: string;
  src: string;
  label: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { key: "cat", src: "🐱", label: "猫" },
  { key: "fox", src: "🦊", label: "狐狸" },
  { key: "elephant", src: "🐘", label: "大象" },
  { key: "dog", src: "🐶", label: "狗" },
  { key: "turtle", src: "🐢", label: "乌龟" },
  { key: "bear", src: "🐻", label: "熊" },
];

const SRC_MAP: Record<string, string> = Object.fromEntries(
  AVATAR_OPTIONS.map((o) => [o.key, o.src]),
);

// 已知 key 返回精灵图地址；否则返回 null（调用方回退为文字/emoji，兼容旧数据）。
export function avatarSrc(value?: string | null): string | null {
  if (!value) return null;
  return SRC_MAP[value] ?? null;
}

export const DEFAULT_AVATAR = "cat";

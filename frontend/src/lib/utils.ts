// 通用工具函数。

// 本地日期 → YYYY-MM-DD（避免时区导致的偏移）
export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

// 中文性别 / 活动水平映射
export const GENDER_LABELS: Record<string, string> = {
  male: "男",
  female: "女",
  other: "其他",
};

export const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "久坐",
  light: "轻度活动",
  moderate: "中度活动",
  active: "高强度活动",
};

export const MEAL_LABELS: Record<string, string> = {
  breakfast: "早餐",
  lunch: "午餐",
  dinner: "晚餐",
  snack: "加餐",
};

// 餐别顺序（i18n 下用 t(`meal.${type}`) 取文案）
export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export const MOOD_EMOJI: Record<number, string> = {
  1: "😣",
  2: "🙁",
  3: "😐",
  4: "🙂",
  5: "😄",
};

// 根据身高体重算 BMI
export function bmi(weightKg: number, heightCm: number): number {
  const h = heightCm / 100;
  return weightKg / (h * h);
}

export function bmiLabel(value: number): string {
  if (value < 18.5) return "偏瘦";
  if (value < 24) return "正常";
  if (value < 28) return "偏胖";
  return "肥胖";
}

// BMI 分级 key（i18n 下用 t(`bmi.${key}`) 取文案）
export function bmiKey(value: number): "thin" | "normal" | "over" | "obese" {
  if (value < 18.5) return "thin";
  if (value < 24) return "normal";
  if (value < 28) return "over";
  return "obese";
}

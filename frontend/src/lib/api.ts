// 统一的 API 客户端：封装 fetch、附带 JWT、错误处理。

import type {
  CompetitionResult,
  DailyRecord,
  Profile,
  ProfileInput,
  Season,
  User,
  UserBrief,
} from "./types";

// 后端地址。允许只填主机名（Render 注入 host 时无协议），自动补 https://。
function resolveApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  if (/^https?:\/\//.test(raw)) return raw;
  return `https://${raw}`;
}

const API_BASE = resolveApiBase();

const TOKEN_KEY = "lw_token";

// ---- 令牌存取（localStorage）----
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

// ---- 底层请求封装 ----
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  // 把当前语言带给后端，使其返回本地化的错误信息
  if (typeof window !== "undefined") {
    headers["X-Lang"] = window.localStorage.getItem("lw_lang") || "zh";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = `请求失败 (${res.status})`;
    try {
      const body = await res.json();
      if (body.detail) detail = typeof body.detail === "string" ? body.detail : JSON.stringify(body.detail);
    } catch {
      /* 忽略解析错误 */
    }
    throw new Error(detail);
  }
  // 204 无内容
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ---- 鉴权 ----
export const api = {
  register: (data: { username: string; password: string; profile: ProfileInput }) =>
    request<{ access_token: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (username: string, password: string) =>
    request<{ access_token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  me: () => request<User>("/api/auth/me"),

  changePassword: (old_password: string, new_password: string) =>
    request<void>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ old_password, new_password }),
    }),

  // ---- 用户 ----
  listUsers: () => request<UserBrief[]>("/api/users"),
  updateProfile: (data: Partial<ProfileInput>) =>
    request<Profile>("/api/users/me/profile", { method: "PUT", body: JSON.stringify(data) }),

  // ---- 赛季 ----
  listSeasons: () => request<Season[]>("/api/seasons"),
  getSeason: (id: number) => request<Season>(`/api/seasons/${id}`),
  createSeason: (data: {
    name: string;
    start_date: string;
    duration_weeks: number;
    participants: { user_id: number; baseline_weight_kg: number }[];
  }) => request<Season>("/api/seasons", { method: "POST", body: JSON.stringify(data) }),

  // ---- 每日记录 ----
  upsertRecord: (data: Partial<DailyRecord> & { season_id: number; record_date: string }) =>
    request<DailyRecord>("/api/records", { method: "PUT", body: JSON.stringify(data) }),

  listRecords: (seasonId: number, userId?: number) =>
    request<DailyRecord[]>(
      `/api/records?season_id=${seasonId}${userId ? `&user_id=${userId}` : ""}`,
    ),

  getDay: (seasonId: number, date: string, userId?: number) =>
    request<DailyRecord | null>(
      `/api/records/day?season_id=${seasonId}&record_date=${date}${userId ? `&user_id=${userId}` : ""}`,
    ),

  // ---- 对抗 / 评分 ----
  getCompetition: (seasonId: number) =>
    request<CompetitionResult>(`/api/competition/${seasonId}`),
};

// 与后端 Pydantic schema 对应的前端类型定义。

export interface Profile {
  id: number;
  user_id: number;
  display_name: string;
  gender: string;
  birth_date: string | null;
  height_cm: number;
  starting_weight_kg: number;
  target_weight_kg: number | null;
  activity_level: string;
  avatar: string;
}

export interface UserBrief {
  id: number;
  username: string;
  profile: Profile | null;
}

export interface User extends UserBrief {
  created_at: string | null;
}

export interface Meal {
  id?: number;
  meal_type: string; // breakfast | lunch | dinner | snack
  description: string;
  calories: number | null;
}

export interface DailyRecord {
  id: number;
  user_id: number;
  season_id: number;
  record_date: string;
  weight_kg: number | null;
  water_ml: number;
  exercise_minutes: number;
  exercise_kcal: number;
  steps: number;
  sleep_hours: number | null;
  mood: number | null;
  notes: string | null;
  meals: Meal[];
}

export interface Participant {
  id: number;
  user_id: number;
  baseline_weight_kg: number;
  wants_end: boolean;
  user: UserBrief | null;
}

export interface Season {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  created_by: number;
  ended_early: boolean;
  participants: Participant[];
  is_finished: boolean;
}

export interface ScoreBreakdown {
  user_id: number;
  user: UserBrief | null;
  baseline_weight_kg: number;
  latest_weight_kg: number | null;
  total_loss_kg: number;
  total_loss_pct: number;
  weight_score: number;
  stability_score: number;
  logging_score: number;
  exercise_score: number;
  water_score: number;
  total_score: number;
  days_logged: number;
  days_exercised: number;
  days_water_goal: number;
  total_water_ml: number;
  total_exercise_minutes: number;
  total_meals_logged: number;
  healthy_weeks: number;
  over_limit_weeks: number;
}

export interface CompetitionResult {
  season_id: number;
  season_name: string;
  is_finished: boolean;
  scores: ScoreBreakdown[];
  winner_user_id: number | null;
  is_tie: boolean;
}

// 资料表单输入
export interface ProfileInput {
  display_name: string;
  gender: string;
  birth_date: string | null;
  height_cm: number;
  starting_weight_kg: number;
  target_weight_kg: number | null;
  activity_level: string;
  avatar: string;
}

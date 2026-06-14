"""赛季评分逻辑（量化标准）。

================== 评分规则 ==================
胜负标准来自需求，全部量化为可解释的分项：

1) 减重得分 weight_score
   - 以「相对自身基数体重的减重百分比」为基础。
   - 按周计算：每周相对该周初体重的减重百分比。
   - 健康上限：单周减重超过 1% 的部分【不计入加分】（防止不健康暴瘦）。
     即每周计入的百分比 = min(本周减重百分比, 1.0)；增重则为负，会扣分。
   - 每计入 1% 记 WEIGHT_POINTS_PER_PCT 分。

2) 健康稳定加分 stability_score
   - 某周减重落在健康区间 [0%, 1%] 内，视为「稳定下降」，加 STABILITY_BONUS_PER_WEEK 分。

3) 坚持加分
   - 记录加分 logging_score：每有记录的一天 +LOGGING_POINTS_PER_DAY。
   - 运动加分 exercise_score：每有运动的一天 +EXERCISE_POINTS_PER_DAY。
   - 喝水加分 water_score：每达到饮水目标的一天 +WATER_POINTS_PER_DAY。

总分 total_score = 上述各项之和（floor 到 0）。总分高者胜，相等为平局。
所有分项与统计都会返回给前端，清楚量化展示给用户。
=============================================
"""

from datetime import date, timedelta

from app.models.record import DailyRecord
from app.models.season import Season, SeasonParticipant

# ---- 可调评分参数 ----
WEIGHT_POINTS_PER_PCT = 100.0  # 每 1% 健康减重的分值
WEEKLY_LOSS_CAP_PCT = 1.0  # 单周减重计分上限（百分比）
STABILITY_BONUS_PER_WEEK = 20.0  # 每个健康周的稳定加分
LOGGING_POINTS_PER_DAY = 3.0  # 每个记录日加分
EXERCISE_POINTS_PER_DAY = 5.0  # 每个运动日加分
WATER_POINTS_PER_DAY = 2.0  # 每个饮水达标日加分
WATER_GOAL_ML = 1500  # 每日饮水目标（毫升）


def _weight_on_or_before(weights_by_date: dict[date, float], target: date, fallback: float) -> float:
    """返回 target 当天或之前最近一次记录的体重；没有则返回 fallback（基数）。"""
    candidates = [d for d in weights_by_date if d <= target]
    if not candidates:
        return fallback
    return weights_by_date[max(candidates)]


def compute_participant_score(
    season: Season,
    participant: SeasonParticipant,
    records: list[DailyRecord],
    today: date,
) -> dict:
    """计算单个参赛者的完整评分明细，返回 dict（与 ScoreBreakdown 对齐）。"""
    baseline = participant.baseline_weight_kg

    # 仅保留有体重的记录，按日期建立映射
    weights_by_date = {r.record_date: r.weight_kg for r in records if r.weight_kg is not None}

    # 最新体重（最近一次称重）
    latest_weight = None
    if weights_by_date:
        latest_weight = weights_by_date[max(weights_by_date)]

    total_loss_kg = (baseline - latest_weight) if latest_weight is not None else 0.0
    total_loss_pct = (total_loss_kg / baseline * 100.0) if baseline else 0.0

    # ---- 逐周计算减重得分与稳定加分 ----
    weight_score = 0.0
    stability_score = 0.0
    healthy_weeks = 0
    over_limit_weeks = 0

    week_start_weight = baseline
    for w in range(season.duration_weeks):
        week_end = season.start_date + timedelta(days=(w + 1) * 7 - 1)
        # 未开始的周不计分
        if week_end > today and (season.start_date + timedelta(days=w * 7)) > today:
            break
        end_weight = _weight_on_or_before(weights_by_date, min(week_end, today), week_start_weight)
        weekly_loss_pct = (
            (week_start_weight - end_weight) / week_start_weight * 100.0
            if week_start_weight
            else 0.0
        )
        counted = min(weekly_loss_pct, WEEKLY_LOSS_CAP_PCT)  # 超过上限不计加分
        weight_score += counted * WEIGHT_POINTS_PER_PCT

        if 0.0 <= weekly_loss_pct <= WEEKLY_LOSS_CAP_PCT:
            healthy_weeks += 1
            stability_score += STABILITY_BONUS_PER_WEEK
        elif weekly_loss_pct > WEEKLY_LOSS_CAP_PCT:
            over_limit_weeks += 1

        week_start_weight = end_weight

    # ---- 坚持类统计 ----
    days_logged = len(records)
    days_exercised = sum(1 for r in records if r.exercise_minutes and r.exercise_minutes > 0)
    days_water_goal = sum(1 for r in records if (r.water_ml or 0) >= WATER_GOAL_ML)
    total_water_ml = sum(r.water_ml or 0 for r in records)
    total_exercise_minutes = sum(r.exercise_minutes or 0 for r in records)
    total_meals_logged = sum(len(r.meals) for r in records)

    logging_score = days_logged * LOGGING_POINTS_PER_DAY
    exercise_score = days_exercised * EXERCISE_POINTS_PER_DAY
    water_score = days_water_goal * WATER_POINTS_PER_DAY

    total_score = max(
        0.0, weight_score + stability_score + logging_score + exercise_score + water_score
    )

    return {
        "user_id": participant.user_id,
        "baseline_weight_kg": round(baseline, 1),
        "latest_weight_kg": round(latest_weight, 1) if latest_weight is not None else None,
        "total_loss_kg": round(total_loss_kg, 1),
        "total_loss_pct": round(total_loss_pct, 2),
        "weight_score": round(weight_score, 1),
        "stability_score": round(stability_score, 1),
        "logging_score": round(logging_score, 1),
        "exercise_score": round(exercise_score, 1),
        "water_score": round(water_score, 1),
        "total_score": round(total_score, 1),
        "days_logged": days_logged,
        "days_exercised": days_exercised,
        "days_water_goal": days_water_goal,
        "total_water_ml": total_water_ml,
        "total_exercise_minutes": total_exercise_minutes,
        "total_meals_logged": total_meals_logged,
        "healthy_weeks": healthy_weeks,
        "over_limit_weeks": over_limit_weeks,
    }


def decide_winner(scores: list[dict]) -> tuple[int | None, bool]:
    """根据总分决出胜者。返回 (winner_user_id, is_tie)。"""
    if not scores:
        return None, False
    max_score = max(s["total_score"] for s in scores)
    leaders = [s for s in scores if s["total_score"] == max_score]
    if len(leaders) != 1:
        return None, True  # 平局
    return leaders[0]["user_id"], False

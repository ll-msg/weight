"""评分与战报相关的出参模型。"""

from pydantic import BaseModel

from app.schemas.user import UserBrief


class ScoreBreakdown(BaseModel):
    """单个参赛者的评分明细（所有数字均量化展示给用户）。"""

    user_id: int
    user: UserBrief | None = None

    # 体重相关
    baseline_weight_kg: float
    latest_weight_kg: float | None
    total_loss_kg: float
    total_loss_pct: float  # 相对基数的减重百分比

    # 分项得分
    weight_score: float  # 减重得分（单周超 1% 部分不计入）
    stability_score: float  # 健康稳定加分
    logging_score: float  # 记录坚持加分
    exercise_score: float  # 运动坚持加分
    water_score: float  # 喝水达标加分
    total_score: float  # 总分

    # 坚持类统计
    days_logged: int
    days_exercised: int
    days_water_goal: int
    total_water_ml: int
    total_exercise_minutes: int
    total_meals_logged: int

    # 健康提示
    healthy_weeks: int
    over_limit_weeks: int  # 单周减重超过 1% 的周数（不健康暴瘦）


class CompetitionResult(BaseModel):
    """对抗结果：双方明细 + 胜者。"""

    season_id: int
    season_name: str
    is_finished: bool
    scores: list[ScoreBreakdown]
    winner_user_id: int | None = None  # 平局时为 None
    is_tie: bool = False

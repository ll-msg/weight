"""赛季相关出入参模型。"""

from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.user import UserBrief


class ParticipantCreate(BaseModel):
    """把某用户加入赛季时提供其基数体重。"""

    user_id: int
    baseline_weight_kg: float = Field(gt=0, lt=500)


class SeasonCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    start_date: date
    duration_weeks: int = Field(ge=1, le=52)
    # 创建赛季时一并加入的参与者（通常为 2 人对抗）
    participants: list[ParticipantCreate] = Field(min_length=1)


class ParticipantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    baseline_weight_kg: float
    # 该参与者是否已申请提前结束
    wants_end: bool = False
    user: UserBrief | None = None


class SeasonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    start_date: date
    end_date: date
    duration_weeks: int
    created_by: int
    # 是否经双方同意提前结束
    ended_early: bool = False
    participants: list[ParticipantOut] = []
    # 是否已结束（到期 或 提前结束）
    is_finished: bool = False

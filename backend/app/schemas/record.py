"""每日记录与餐食的出入参模型。"""

from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class MealBase(BaseModel):
    meal_type: str = "breakfast"
    description: str = Field(min_length=1)
    calories: int | None = Field(default=None, ge=0)


class MealCreate(MealBase):
    pass


class MealOut(MealBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class DailyRecordUpsert(BaseModel):
    """新增 / 更新某天记录。以 (season_id, record_date) 定位。"""

    season_id: int
    record_date: date
    weight_kg: float | None = Field(default=None, gt=0, lt=500)
    water_ml: int = Field(default=0, ge=0)
    exercise_minutes: int = Field(default=0, ge=0)
    exercise_kcal: int = Field(default=0, ge=0)
    steps: int = Field(default=0, ge=0)
    sleep_hours: float | None = Field(default=None, ge=0, le=24)
    mood: int | None = Field(default=None, ge=1, le=5)
    notes: str | None = None
    # 当天餐食列表（整组覆盖）
    meals: list[MealCreate] = []


class DailyRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    season_id: int
    record_date: date
    weight_kg: float | None
    water_ml: int
    exercise_minutes: int
    exercise_kcal: int
    steps: int
    sleep_hours: float | None
    mood: int | None
    notes: str | None
    meals: list[MealOut] = []

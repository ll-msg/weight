"""每日记录与餐食记录模型。

DailyRecord：某用户在某赛季某天的综合记录（体重 / 喝水 / 运动 / 睡眠 / 心情 等）。
MealRecord：当天的多条餐食（食谱），一对多挂在 DailyRecord 下。
"""

from datetime import date, datetime, timezone

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DailyRecord(Base):
    __tablename__ = "daily_records"
    # 同一用户同一赛季同一天只允许一条记录
    __table_args__ = (UniqueConstraint("user_id", "season_id", "record_date", name="uq_daily"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    season_id: Mapped[int] = mapped_column(ForeignKey("seasons.id"), nullable=False, index=True)
    record_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    # 体重（公斤），可空（当天可能未称重）
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    # 喝水量（毫升）
    water_ml: Mapped[int] = mapped_column(Integer, default=0)
    # 运动时长（分钟）
    exercise_minutes: Mapped[int] = mapped_column(Integer, default=0)
    # 估算消耗（千卡）
    exercise_kcal: Mapped[int] = mapped_column(Integer, default=0)
    # 步数
    steps: Mapped[int] = mapped_column(Integer, default=0)
    # 睡眠时长（小时）
    sleep_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    # 心情：1~5
    mood: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # 备注
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # 当天餐食
    meals: Mapped[list["MealRecord"]] = relationship(
        back_populates="daily_record", cascade="all, delete-orphan"
    )


class MealRecord(Base):
    __tablename__ = "meal_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    daily_record_id: Mapped[int] = mapped_column(
        ForeignKey("daily_records.id"), nullable=False, index=True
    )
    # 餐别：breakfast / lunch / dinner / snack
    meal_type: Mapped[str] = mapped_column(String(20), default="breakfast")
    # 食谱描述
    description: Mapped[str] = mapped_column(Text, nullable=False)
    # 估算热量（千卡），可空
    calories: Mapped[int | None] = mapped_column(Integer, nullable=True)

    daily_record: Mapped["DailyRecord"] = relationship(back_populates="meals")

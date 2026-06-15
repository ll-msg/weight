"""赛季与赛季参与者模型。"""

from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Season(Base):
    __tablename__ = "seasons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # 赛季名称
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    # 开始日期
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    # 赛季时长（周），可自定义
    duration_weeks: Mapped[int] = mapped_column(Integer, nullable=False, default=8)
    # 结束日期（由 start_date + duration_weeks 计算并冗余存储，便于查询）
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    # 创建者用户 id
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    # 是否经双方同意「提前结束」。一旦为真，赛季即视为已结束并按当前进度结算。
    ended_early: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # 参与者
    participants: Mapped[list["SeasonParticipant"]] = relationship(
        back_populates="season", cascade="all, delete-orphan"
    )


class SeasonParticipant(Base):
    """某用户在某赛季中的参赛信息。"""

    __tablename__ = "season_participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    season_id: Mapped[int] = mapped_column(ForeignKey("seasons.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    # 赛季基数体重（公斤）—— 减重百分比相对此值计算
    baseline_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    # 是否已申请「提前结束」。当所有参与者都为真时，赛季提前结束。
    wants_end: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    season: Mapped["Season"] = relationship(back_populates="participants")
    # 关联用户（用于带出昵称等信息），不反向写入
    user: Mapped["User"] = relationship()  # noqa: F821

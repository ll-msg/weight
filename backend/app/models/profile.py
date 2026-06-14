"""用户基础资料模型。"""

from datetime import date

from sqlalchemy import Date, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)

    # 展示昵称
    display_name: Mapped[str] = mapped_column(String(50), nullable=False)
    # 性别：male / female / other
    gender: Mapped[str] = mapped_column(String(10), default="other")
    # 生日（用于推算年龄，可空）
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    # 身高（厘米）
    height_cm: Mapped[float] = mapped_column(Float, nullable=False)
    # 初始体重（公斤）
    starting_weight_kg: Mapped[float] = mapped_column(Float, nullable=False)
    # 目标体重（公斤）
    target_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    # 活动水平：sedentary / light / moderate / active
    activity_level: Mapped[str] = mapped_column(String(20), default="light")
    # 头像 emoji 或简单标识
    avatar: Mapped[str] = mapped_column(String(10), default="🙂")

    user: Mapped["User"] = relationship(back_populates="profile")  # noqa: F821

"""聚合导出所有模型，便于 Base.metadata 收集表结构。"""

from app.models.user import User
from app.models.profile import UserProfile
from app.models.season import Season, SeasonParticipant
from app.models.record import DailyRecord, MealRecord

__all__ = [
    "User",
    "UserProfile",
    "Season",
    "SeasonParticipant",
    "DailyRecord",
    "MealRecord",
]

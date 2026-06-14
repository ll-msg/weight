"""用户基础资料的出入参模型。"""

from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class ProfileBase(BaseModel):
    display_name: str = Field(min_length=1, max_length=50)
    gender: str = "other"
    birth_date: date | None = None
    height_cm: float = Field(gt=0, lt=300)
    starting_weight_kg: float = Field(gt=0, lt=500)
    target_weight_kg: float | None = Field(default=None, gt=0, lt=500)
    activity_level: str = "light"
    avatar: str = "🙂"


class ProfileCreate(ProfileBase):
    """注册时一并创建资料。"""

    pass


class ProfileUpdate(BaseModel):
    """更新资料（所有字段可选）。"""

    display_name: str | None = None
    gender: str | None = None
    birth_date: date | None = None
    height_cm: float | None = None
    starting_weight_kg: float | None = None
    target_weight_kg: float | None = None
    activity_level: str | None = None
    avatar: str | None = None


class ProfileOut(ProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int

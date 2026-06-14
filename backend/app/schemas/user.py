"""用户与鉴权相关的出入参模型。"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.profile import ProfileCreate, ProfileOut


class UserRegister(BaseModel):
    """注册请求：账号 + 密码 + 基础资料。"""

    username: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=4, max_length=128)
    profile: ProfileCreate


class UserLogin(BaseModel):
    username: str
    password: str


class PasswordChange(BaseModel):
    """修改密码：当前密码 + 新密码。"""

    old_password: str = Field(min_length=1)
    new_password: str = Field(min_length=4, max_length=128)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    """对外返回的用户信息（不含密码）。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    created_at: datetime | None = None
    profile: ProfileOut | None = None


class UserBrief(BaseModel):
    """精简用户信息，用于列表选择。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    profile: ProfileOut | None = None

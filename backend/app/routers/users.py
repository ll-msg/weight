"""用户路由：列出用户（用于选择对手）、查看/更新资料。"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.profile import ProfileOut, ProfileUpdate
from app.schemas.user import UserBrief

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserBrief])
def list_users(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    """列出所有用户（创建赛季选择对手时使用）。"""
    return db.query(User).all()


@router.put("/me/profile", response_model=ProfileOut)
def update_my_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """更新当前用户的基础资料。"""
    profile = current.profile
    if profile is None:
        raise HTTPException(status_code=404, detail="资料不存在")
    # 仅更新提供的字段
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile

"""鉴权路由：注册、登录、获取当前用户。"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.i18n import get_lang, translate
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.deps import get_current_user
from app.models.profile import UserProfile
from app.models.user import User
from app.schemas.user import PasswordChange, Token, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Session = Depends(get_db), lang: str = Depends(get_lang)):
    """注册新用户并创建基础资料，返回登录令牌。"""
    exists = db.query(User).filter(User.username == payload.username).first()
    if exists:
        raise HTTPException(status_code=400, detail=translate("username_taken", lang))

    user = User(username=payload.username, password_hash=hash_password(payload.password))
    db.add(user)
    db.flush()  # 拿到 user.id

    profile = UserProfile(user_id=user.id, **payload.profile.model_dump())
    db.add(profile)
    db.commit()
    db.refresh(user)

    return Token(access_token=create_access_token(user.id))


@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db), lang: str = Depends(get_lang)):
    """账号密码登录。"""
    user = db.query(User).filter(User.username == payload.username).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail=translate("bad_credentials", lang))
    return Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserOut)
def me(current: User = Depends(get_current_user)):
    """获取当前登录用户信息。"""
    return current


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    lang: str = Depends(get_lang),
):
    """修改当前登录用户的密码：先校验当前密码，再写入新密码哈希。"""
    if not verify_password(payload.old_password, current.password_hash):
        raise HTTPException(status_code=400, detail=translate("wrong_current_password", lang))
    current.password_hash = hash_password(payload.new_password)
    db.commit()

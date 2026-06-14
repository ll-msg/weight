"""FastAPI 依赖：解析当前登录用户。"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.i18n import get_lang, translate
from app.core.security import decode_access_token
from app.database import get_db
from app.models.user import User

# 从 Authorization: Bearer <token> 头读取令牌
_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
    lang: str = Depends(get_lang),
) -> User:
    """校验令牌并返回当前用户，失败则 401。"""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=translate("no_credentials", lang)
        )
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=translate("invalid_token", lang)
        )
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=translate("user_not_found", lang)
        )
    return user

"""安全相关工具：密码哈希与 JWT 令牌。

密码哈希使用标准库 hashlib.pbkdf2_hmac（纯 Python，无第三方原生依赖，
在 Windows / Python 3.13 上无兼容问题）。令牌使用 PyJWT。
"""

import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import settings

# PBKDF2 参数
_HASH_NAME = "sha256"
_ITERATIONS = 200_000
_SALT_BYTES = 16


def hash_password(password: str) -> str:
    """生成密码哈希，格式：pbkdf2_sha256$迭代次数$salt(hex)$hash(hex)。"""
    salt = os.urandom(_SALT_BYTES)
    dk = hashlib.pbkdf2_hmac(_HASH_NAME, password.encode("utf-8"), salt, _ITERATIONS)
    return f"pbkdf2_{_HASH_NAME}${_ITERATIONS}${salt.hex()}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """校验明文密码与存储哈希是否匹配（使用常量时间比较）。"""
    try:
        algo, iterations, salt_hex, hash_hex = stored.split("$")
        assert algo == f"pbkdf2_{_HASH_NAME}"
        dk = hashlib.pbkdf2_hmac(
            _HASH_NAME, password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
        )
        return hmac.compare_digest(dk.hex(), hash_hex)
    except (ValueError, AssertionError):
        return False


def create_access_token(subject: str | int) -> str:
    """为给定用户标识创建 JWT 访问令牌。"""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(subject), "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> int | None:
    """解码令牌，返回用户 id；无效则返回 None。"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None

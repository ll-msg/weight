"""数据库连接与会话管理。

使用 SQLAlchemy。默认 SQLite，可通过 DATABASE_URL 切换到 PostgreSQL。
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


def normalize_db_url(url: str) -> str:
    """规整数据库连接串。

    Render / Heroku 等平台给出的 Postgres 串是 `postgres://` 或 `postgresql://`，
    SQLAlchemy 默认会用未安装的 psycopg2 方言。这里统一改写为 psycopg(v3) 方言。
    """
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://") :]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


DB_URL = normalize_db_url(settings.DATABASE_URL)

# SQLite 需要 check_same_thread=False 以配合多线程的 FastAPI；其他数据库忽略此参数。
connect_args = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}

# pool_pre_ping 在云数据库空闲断连后自动重连，避免冷启动报错。
engine = create_engine(DB_URL, connect_args=connect_args, echo=False, pool_pre_ping=True)

# 会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """所有 ORM 模型的基类。"""

    pass


def get_db():
    """FastAPI 依赖：每个请求一个数据库会话，结束后自动关闭。"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """创建所有表（若不存在）。在应用启动时调用。"""
    # 导入模型以确保它们已注册到 Base.metadata
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)

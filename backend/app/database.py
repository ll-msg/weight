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


def _ensure_columns() -> None:
    """轻量「迁移」：为已存在的旧表补充新增列（create_all 不会 ALTER 已有表）。

    无 Alembic 的情况下，保证线上旧库（SQLite/PostgreSQL）也能拿到新列。
    BOOLEAN DEFAULT FALSE 在 PostgreSQL 与较新 SQLite 上均可用。
    """
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    # 表 -> {列名: 建表 DDL 片段}
    wanted: dict[str, dict[str, str]] = {
        "seasons": {"ended_early": "BOOLEAN NOT NULL DEFAULT FALSE"},
        "season_participants": {"wants_end": "BOOLEAN NOT NULL DEFAULT FALSE"},
    }
    existing_tables = set(inspector.get_table_names())
    with engine.begin() as conn:
        for table, cols in wanted.items():
            if table not in existing_tables:
                continue  # create_all 会负责新表
            have = {c["name"] for c in inspector.get_columns(table)}
            for col, ddl in cols.items():
                if col not in have:
                    conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {ddl}"))


def init_db() -> None:
    """创建所有表（若不存在）+ 补充新增列。在应用启动时调用。"""
    # 导入模型以确保它们已注册到 Base.metadata
    from app import models  # noqa: F401

    Base.metadata.create_all(bind=engine)
    _ensure_columns()

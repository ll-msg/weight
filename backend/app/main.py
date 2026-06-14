"""FastAPI 应用入口。

启动时自动建表（SQLite 本地文件），注册各功能路由与 CORS。
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import init_db
from app.routers import auth, competition, records, seasons, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时建表
    init_db()
    yield


app = FastAPI(title="减肥对抗赛 API", version="1.0.0", lifespan=lifespan)

# 跨域配置，允许前端访问。
# 鉴权使用 Authorization 头（Bearer Token）而非 Cookie，因此无需携带凭证；
# 这样也允许把 CORS_ORIGINS 设为 "*" 以简化部署。
_origins = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(seasons.router)
app.include_router(records.router)
app.include_router(competition.router)


@app.get("/api/health", tags=["health"])
def health():
    """健康检查。"""
    return {"status": "ok"}

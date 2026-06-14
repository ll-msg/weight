"""应用配置。

使用 pydantic-settings 从环境变量 / .env 文件读取配置。
所有可调参数集中在此，方便维护与切换环境（如换数据库）。
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # JWT 签名密钥
    SECRET_KEY: str = "dev-insecure-secret-change-me"
    # JWT 算法
    ALGORITHM: str = "HS256"
    # Token 有效期（分钟），默认 7 天
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # 数据库连接串，默认本地 SQLite
    DATABASE_URL: str = "sqlite:///./app.db"

    # 允许的前端跨域来源（逗号分隔）。
    # 默认 "*" 允许所有来源：本地开发免去 localhost/127.0.0.1/端口不一致导致的 CORS 报错；
    # 因鉴权走 Authorization 头（Bearer Token）而非 Cookie，开放来源是安全可接受的。
    # 部署到 Render 时 render.yaml 会自动注入具体前端域名，覆盖此默认值。
    CORS_ORIGINS: str = "*"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        """把逗号分隔的字符串拆成列表。

        - 支持 "*"（允许所有来源，因鉴权走 Authorization 头而非 Cookie，安全可接受）。
        - 只填主机名时（Render 注入 host 无协议）自动补 https://，以匹配浏览器 Origin。
        """
        items = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        normalized: list[str] = []
        for o in items:
            if o == "*" or o.startswith("http://") or o.startswith("https://"):
                normalized.append(o)
            else:
                normalized.append(f"https://{o}")
        return normalized


# 全局单例配置
settings = Settings()

"""后端错误信息的中英双语映射。

前端在请求头 X-Lang 里带上当前语言（zh/en）；没有则回退 Accept-Language，默认 zh。
路由用 message key 抛出本地化错误，例如：
    raise HTTPException(404, detail=translate("season_not_found", lang))
"""

from fastapi import Header

# key -> { 语言: 文案 }，支持 {param} 占位
MESSAGES: dict[str, dict[str, str]] = {
    "username_taken": {"zh": "用户名已被占用", "en": "Username is already taken"},
    "bad_credentials": {"zh": "用户名或密码错误", "en": "Incorrect username or password"},
    "wrong_current_password": {"zh": "当前密码不正确", "en": "Current password is incorrect"},
    "no_credentials": {"zh": "未提供登录凭证", "en": "No login credentials provided"},
    "invalid_token": {"zh": "登录凭证无效或已过期", "en": "Login credentials are invalid or expired"},
    "user_not_found": {"zh": "用户不存在", "en": "User not found"},
    "profile_not_found": {"zh": "资料不存在", "en": "Profile not found"},
    "season_not_found": {"zh": "赛季不存在", "en": "Season not found"},
    "not_participant": {
        "zh": "你不是该赛季的参与者",
        "en": "You are not a participant in this season",
    },
    "user_id_not_found": {"zh": "用户 {id} 不存在", "en": "User {id} not found"},
    "no_permission": {
        "zh": "无权删除该赛季",
        "en": "You don't have permission to delete this season",
    },
}


def translate(key: str, lang: str = "zh", **params) -> str:
    """按语言取文案并填充占位；缺失时回退中文，再回退 key 本身。"""
    entry = MESSAGES.get(key, {})
    msg = entry.get(lang) or entry.get("zh") or key
    for k, v in params.items():
        msg = msg.replace("{" + k + "}", str(v))
    return msg


def get_lang(
    x_lang: str | None = Header(default=None),
    accept_language: str | None = Header(default=None),
) -> str:
    """从请求头解析语言：优先 X-Lang，其次 Accept-Language，默认 zh。"""
    if x_lang in ("zh", "en"):
        return x_lang
    if accept_language and accept_language.lower().startswith("en"):
        return "en"
    return "zh"

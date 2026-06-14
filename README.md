# 减肥对抗赛 · Weight-Loss Showdown

一款简约、响应式、移动端优先的「减肥对抗赛」网页应用。支持赛季设定、每日记录（体重 / 食谱 / 喝水 / 运动 等）、双人对抗对比、科学量化评分，以及赛季结束后可保存到本地相册的战报。

## 技术栈

- **前端**：Next.js 14（App Router）+ TypeScript + 原生 CSS（移动端优先、简约主题）
- **后端**：Python + FastAPI + SQLAlchemy
- **数据库**：SQLite（本地单文件存储；代码用 SQLAlchemy 封装，可平滑切换 PostgreSQL）
- **鉴权**：用户名 + 密码（PBKDF2 哈希）+ JWT

> 全部本地运行，数据不上云。

## 目录结构

```
loseweight/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── core/            # 配置、安全（密码哈希/JWT）
│   │   ├── models/          # SQLAlchemy 数据模型
│   │   ├── schemas/         # Pydantic 出入参模型
│   │   ├── routers/         # 路由（按功能拆分）
│   │   ├── services/        # 业务逻辑（评分、战报）
│   │   ├── database.py      # 数据库连接与会话
│   │   ├── deps.py          # 依赖注入（当前用户等）
│   │   └── main.py          # 应用入口
│   └── requirements.txt
└── frontend/                # Next.js 前端
    └── src/
        ├── app/             # 页面（登录/注册/记录/对抗/赛季/战报）
        ├── components/      # 复用组件
        └── lib/            # API 客户端、鉴权上下文、类型
```

## 快速开始

### 1. 启动后端

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

后端启动后：
- API 文档：http://localhost:8000/docs
- 首次启动会自动在 `backend/` 下创建 `app.db`（SQLite 数据库文件）

### 2. 启动前端

```powershell
cd frontend
npm install
npm run dev
```

打开 http://localhost:3000 即可使用（手机访问可用同一局域网 IP）。

> 本地调试请用 `npm run dev`。由于已开启静态导出（`output: "export"`，便于部署），本地不要用 `npm start`。

## 异地双人 / 在线部署

要让你和**异地的对手**访问同一份数据、随时在线，把项目部署到 Render（保留 Next.js + Python + PostgreSQL 原栈，免费档即可起步）。仓库根目录的 [`render.yaml`](render.yaml) 已配置好一键部署，步骤见 **[DEPLOY.md](DEPLOY.md)**。

## 玩法

1. 注册两个用户（你和对手），各自填写基础资料（身高、初始体重、目标体重等）。
2. 创建一个赛季，设定时长（周数），把双方加入赛季并各自登记「基数体重」。
3. 每天在主界面记录体重、食谱、喝水、运动等。
4. 「对抗」页面左右对比双方当日数据与累计得分。
5. 赛季结束生成战报，赢家高亮，可一键保存图片到本地相册。

## 评分规则（量化标准）

详见 `backend/app/services/scoring.py` 顶部注释。核心：

- **减重得分**：相对自身基数的减重百分比累加；**单周减重超过 1% 的部分不计入加分**（防止不健康暴瘦）。
- **健康稳定加分**：每个处于健康区间（0~1%/周）的周次给予稳定加分。
- **坚持加分**：记录天数、运动天数、喝水达标天数等。

最终总分高者胜，所有分项都会量化展示给用户。

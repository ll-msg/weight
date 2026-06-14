# 部署到 Render（异地双人共享）

把应用部署到 [Render](https://render.com)，让你和异地的对手访问**同一份数据**、随时在线。
部署后保留了原始技术栈：**Next.js 前端 + Python(FastAPI) 后端 + PostgreSQL 数据库**。

```
对手的浏览器 ─┐
              ├─→  Render 静态前端 (Next.js)  ──→  Render 后端 (FastAPI)  ──→  Render PostgreSQL
你的浏览器  ─┘                                                                （唯一一份共享数据）
```

## 一、准备：把代码推到 GitHub

Render 从 Git 仓库部署，所以先把项目推到 GitHub（私有仓库即可）。

```powershell
cd F:\Vibe\loseweight
git init
git add .
git commit -m "减肥对抗赛 初始版本"
# 在 GitHub 新建一个空仓库后：
git remote add origin https://github.com/你的用户名/loseweight.git
git branch -M main
git push -u origin main
```

> `.gitignore` 已排除 `node_modules`、`.venv`、`.env`、`app.db` 等，不会上传依赖和本地数据。

## 二、一键部署（Blueprint）

仓库根目录已包含 [`render.yaml`](render.yaml)，它会自动创建数据库 + 后端 + 前端三件套，并自动把它们的地址/密钥互相注入，**无需手填 URL**。

1. 登录 Render → 右上角 **New +** → **Blueprint**。
2. 连接并选择你刚推送的 GitHub 仓库。
3. Render 读取 `render.yaml`，列出将要创建的资源：
   - `loseweight-db`（PostgreSQL，免费档）
   - `loseweight-api`（FastAPI 后端）
   - `loseweight-web`（Next.js 静态前端）
4. 点 **Apply**，等待构建完成（首次约 3–5 分钟）。

完成后你会得到一个前端地址，形如：
`https://loseweight-web.onrender.com`

把这个网址发给对手，双方各自注册账号、创建/加入赛季即可。**数据都存在同一个 Render Postgres 里**，谁登录都能看到对方的记录与对抗结果。

## 三、验证

1. 打开前端网址 → 注册「你」的账号。
2. 让对手用同一网址注册「对手」账号（或你先替他注册）。
3. 你创建赛季时即可在对手下拉框里选到他。
4. 双方各自记录，进入「对抗 / 战报」页查看共享对比。

> 健康检查：后端 `https://loseweight-api.onrender.com/api/health` 返回 `{"status":"ok"}` 即正常。

## 免费档须知

- **后端会休眠**：免费 Web 服务闲置约 15 分钟后休眠，下次访问需冷启动约 30–60 秒（页面会转圈一会儿，属正常）。
- **免费 PostgreSQL 有有效期**：Render 免费数据库到期后会被回收，需升级或重建。长期使用建议把数据库（和后端）升级到最低付费档（约 $7/月）即可全天候稳定、无冷启动。
- 前端是静态站点，**不休眠、免费常在**。

## 常见问题

- **改了代码怎么更新线上？** 直接 `git push`，Render 会自动重新构建部署。
- **前端报跨域 / 连不上后端？** 确认 `loseweight-api` 的环境变量 `CORS_ORIGINS` 是前端域名（Blueprint 已自动注入；手动建服务时需自己填，或临时填 `*`）。
- **想换成只读分享/更多人参赛？** 后端已支持多参与者，赛季可加入两人以上；如需排行榜可再扩展。

## 本地开发仍然可用

本地不受影响：后端默认用 SQLite，前端用 `npm run dev`。详见 [README.md](README.md)。
（注意：因开启了静态导出 `output: "export"`，本地请用 `npm run dev` 调试，不要用 `npm start`。）

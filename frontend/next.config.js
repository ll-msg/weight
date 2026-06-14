/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 导出为纯静态站点（可部署到 Render Static Site / 任意静态托管，免费且不休眠）。
  // 本应用全部为客户端组件、无服务端路由，适合静态导出。
  output: "export",
  // 静态导出下需关闭 Next 图片优化（本项目未用 next/image，仅为满足导出要求）。
  images: { unoptimized: true },
};

module.exports = nextConfig;

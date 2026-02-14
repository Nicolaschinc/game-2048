# 部署指南 (Deployment Guide)

本项目基于 React + Vite 构建，支持多种静态托管服务。推荐使用 **Cloudflare Pages** 以获得最佳的国内访问速度和稳定性。

## 方案一：Cloudflare Pages (推荐)

Cloudflare Pages 提供全球 CDN 加速，且 `*.pages.dev` 域名在国内通常可以直连。

### 方法 A：Web 界面自动部署 (GitHub 集成)
1. 访问 [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages) 并登录。
2. 点击 **Create a project** > **Connect to Git**。
3. 选择本项目的 GitHub 仓库。
4. 在 **Build settings** 中确认以下配置（通常会自动检测）：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
5. 点击 **Save and Deploy**。
6. 以后每次向 `main` 分支推送代码 (`git push`)，Cloudflare 会自动触发重新构建和部署。

### 方法 B：命令行部署 (Wrangler CLI)
如果你不想绑定 GitHub，也可以在本地构建后直接上传。

1. 安装 Cloudflare 官方 CLI 工具：
   ```bash
   npm install -g wrangler
   ```
2. 登录账号（会弹出浏览器授权）：
   ```bash
   wrangler login
   ```
3. 执行构建并部署：
   ```bash
   # 1. 本地构建
   npm run build
   
   # 2. 上传 dist 目录
   wrangler pages deploy dist --project-name=game-2048
   ```

---

## 方案二：Vercel (备选)

Vercel 部署速度极快，但默认域名 `*.vercel.app` 在国内可能无法访问。

1. 安装 Vercel CLI：
   ```bash
   npm install -g vercel
   ```
2. 部署流程：
   ```bash
   # 首次关联项目并部署预览环境
   vercel
   
   # 部署到生产环境
   vercel --prod
   ```
3. **国内访问优化**：
   建议在 Vercel 后台绑定一个自己的域名（需配置 CNAME），或者使用 Cloudflare Pages 代替。

---

## 常见问题排查

### 1. 构建失败：`package.json not found`
**原因**：Cloudflare 拉取的是 GitHub 仓库的代码。如果本地新建的文件（如 `package.json`）没有推送到远程仓库，云端构建就会失败。
**解决**：确保本地更改已提交并推送：
```bash
git add .
git commit -m "feat: update project"
git push
```

### 2. 部署后页面白屏或 404
**原因**：构建输出目录配置错误，或者单页应用 (SPA) 路由未配置 fallback。
**解决**：
- 确认 Build output directory 设置为 `dist`。
- 本项目已包含 `vercel.json` 处理 Vercel 的路由重写。Cloudflare Pages 默认支持 SPA 路由。

### 3. 本地开发局域网访问
若需在局域网（如手机）访问开发服务器：
1. 确保 `vite.config.js` 中配置了 `host: '0.0.0.0'`。
2. 运行 `npm run dev`。
3. 手机访问 `http://<电脑IP>:3006`。

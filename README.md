<p align="center">
  <img src="https://img.shields.io/badge/vite-^6.3-blue?logo=vite" alt="vite">
  <img src="https://img.shields.io/badge/typescript-^5.7-3178c6?logo=typescript" alt="ts">
  <img src="https://img.shields.io/badge/deploy-GitHub%20Pages-brightgreen?logo=github" alt="pages">
  <img src="https://img.shields.io/badge/license-MIT-gray" alt="license">
</p>

<h1 align="center">PhotoColors</h1>

<p align="center">
  <b>照片色彩编辑器</b> — 上传照片，AI 取色，自动合成带地点与时间的社交媒体分享图。
  <br>
  纯浏览器端运行，不依赖后端，无需安装。
</p>

<p align="center">
  <a href="https://anamaxlec.github.io/PhotoColors-Web/">Live Demo</a>
  &nbsp;·&nbsp;
  <a href="#功能">功能</a>
  &nbsp;·&nbsp;
  <a href="#快速开始">快速开始</a>
  &nbsp;·&nbsp;
  <a href="#架构">架构</a>
</p>

---

## 预览

> 上传一张照片，PhotoColors 会自动分析场景色调，生成上色区 + 照片区 + 文字叠印的排版输出。

| | |
|:---:|:---:|
| **智能取色引擎** | **6 种边框预设** |
| 逐像素 HSL 采样，识别夜景冷/暖、天蓝、中性等 6 种场景，自动计算背景色与文字色的协调对比度 | 无边框 · 极简 · 经典 · 拍立得 · 胶片 · 投影，支持白边百分比 + 黑线像素自由微调 |

## 功能

<table>
<tr>
  <td width="50%">

### 取色 & 风格
- 5 种色彩偏移：自动 / 柔粉 / 雾蓝 / 暖杏 / 砂灰
- 4 档字色强度：柔和 → 淡雅 → 平衡 → 跳脱
- 3 种描边样式：无 / 柔和 / 轻雾柔化
- 柔和程度无级滑块

  </td>
  <td width="50%">

### 排版 & 字体
- 地点 + 时间双行文字，各自独立开关
- 11 种字体：System UI 系列 + Google Fonts（Inter、Noto Sans SC、Jakarta Plus、Manrope …）
- 字号 / 行距 / 纵向位置自由拖动

  </td>
</tr>
<tr>
  <td>

### 边框系统
- 6 种一键预设
- 白边宽度：0–20%
- 黑线宽度：0–12px
- 拍立得 / 投影预设自带圆角与阴影

  </td>
  <td>

### EXIF 自动填入
- 读取 `DateTimeOriginal` 自动填充时间
- 曝光三要素（光圈 / 快门 / ISO / 焦距）可供后续扩展

  </td>
</tr>
<tr>
  <td>

### 模板管理
- 一键保存当前设置为模板
- 模板全部存储在 `localStorage`
- 支持 JSON 导出 / 导入，方便分享预设

  </td>
  <td>

### 批量处理
- 一次导入多张照片
- Web Worker + OffscreenCanvas 后台渲染
- 全部完成后自动生成 ZIP 下载

  </td>
</tr>
</table>

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/anamaxlec/PhotoColors-Web.git
cd PhotoColors-Web

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build
```

构建产物在 `dist/` 目录下，可直接部署到任意静态托管（GitHub Pages / Vercel / Netlify）。

**在线体验**：https://anamaxlec.github.io/PhotoColors-Web/

## 技术栈

| 类别 | 选型 | 说明 |
|:---|:---|:---|
| 框架 | [Petite-Vue](https://github.com/vuejs/petite-vue) · 3KB | 轻量响应式，v-model 双向绑定，零编译 |
| 语言 | TypeScript 5.7 | 全量类型覆盖 |
| 构建 | Vite 6 | 开发热更新 + 生产 tree-shaking |
| 取色 | 自研 HSL 引擎 | 逐像素采样 → 16-分桶量化 → 场景识别 → 评分排序 |
| 渲染 | Canvas 2D | 支持 Display P3 色域 |
| EXIF | [exifr](https://github.com/MikeKovarik/exifr) 7.x | 高性能 EXIF 解析 |
| 批量 | JSZip + FileSaver | ZIP 流式打包 & 触发下载 |
| 部署 | GitHub Actions + Pages | Push 到 main 自动部署 |

## 目录结构

```
PhotoColors-Web/
├── index.html                  # SPA 入口
├── styles.css                  # 响应式 UI 样式（亮/暗双主题）
├── package.json
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── core/
    │   ├── types.ts            # 全量类型定义
    │   ├── color.ts            # RGB ↔ HSL 转换 / 混合 / 对比度 / 色相距离
    │   ├── palette.ts          # 取色算法引擎（场景分析 + 评分排序 + 偏移柔化）
    │   ├── edge.ts             # 文字描边（无 / 柔和 / 轻雾）
    │   ├── fonts.ts            # 11 种字体预设 + 字号模板
    │   └── renderer.ts         # Canvas 合成渲染（白底 → 色块 → 照片 → 文字 → 黑线）
    ├── features/
    │   ├── border/
    │   │   └── presets.ts      # 6 种边框预设 + 圆角/阴影
    │   ├── exif/
    │   │   └── reader.ts       # EXIF 读取（时间 + 曝光三要素）
    │   ├── template/
    │   │   └── manager.ts      # CRUD + localStorage 持久化 + JSON 导入/导出
    │   └── batch/
    │       ├── manager.ts      # Worker 调度 & ZIP 打包
    │       └── worker.ts       # Web Worker：OffscreenCanvas 并行渲染
    ├── ui/
    │   └── store.ts            # Petite-Vue reactive store（70+ 状态字段）
    └── main.ts                 # 应用入口 & 事件绑定
```

## 架构

```
用户交互 (Petite-Vue v-model)
   │
   ▼
Store.updateAll()
   │
   ├──► palette.ts     图片 → 像素采样 → HSL 场景分析 → 评分排序 → 柔化 / 主题偏移 → 对比度确保
   │                    输出 { bg, text, accent }
   │
   └──► renderer.ts    取 palette + 排版参数 → Canvas 2D 分层合成
                          ┌─ 白色基底
                          ├─ 有色背景区（bg 填充）
                          ├─ 照片图（drawImage）
                          ├─ 文字叠印（地点 / 时间 + 描边阴影）
                          └─ 黑线内描边
                       输出 PNG（导出）或 Canvas（预览）
```

每一帧取色纯前端完成，照片不会离开你的电脑。

## License

MIT · [@anamaxlec](https://github.com/anamaxlec)

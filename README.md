# PhotoColors Web

照片色彩编辑器 — 上传照片自动取色，合成带地点与时间的分享图。

## 功能

- **智能取色** — 自动分析照片场景（夜景冷/暖、天蓝、暖色调、中性），生成协调的背景色与文字色
- **取色模式** — 5 种色彩偏移：自动、柔粉、雾蓝、暖杏、砂灰
- **文字排版** — 地点/时间文字，可调节字号、行距、纵向位置，11 种字体（Google Fonts + 系统字体）
- **风格控制** — 字色强度（柔和/淡雅/平衡/跳脱）、描边样式（无/柔和/轻雾）、柔和程度滑块
- **边框预设** — 6 种预设：无边框、极简、经典、拍立得、胶片、投影；支持白边百分比 + 黑线像素微调
- **EXIF 读取** — 自动读取拍摄时间（DateTimeOriginal）和曝光三要素（光圈/快门/ISO/焦距）
- **模板系统** — 保存当前设置为模板、应用已有模板、导入/导出 JSON 模板文件（localStorage 持久化）
- **批量处理** — 批量导入多张照片，Web Worker 后台渲染，自动生成 ZIP 包下载
- **深色模式** — 自动跟随系统，也可手动切换
- **拖拽上传** — 支持点击选择或拖拽文件到预览区

## 技术栈

- **Vite** — 构建打包
- **TypeScript** — 类型安全
- **Petite-Vue** (3KB) — 轻量响应式 UI
- **exifr** — EXIF 元数据解析
- **JSZip + FileSaver** — 批量 ZIP 导出
- **Web Worker** — 后台批量渲染（OffscreenCanvas）

## 目录结构

```
src/
  core/
    types.ts          # 类型定义
    color.ts          # 颜色工具函数（RGB/HSL/混合/对比度）
    palette.ts        # 取色算法引擎
    edge.ts           # 文字描边样式
    fonts.ts          # 字体预设（11种）
    renderer.ts       # Canvas 渲染器
  features/
    border/
      presets.ts      # 边框预设系统
    exif/
      reader.ts       # EXIF 读取
    template/
      manager.ts      # 模板保存/加载/导入/导出
    batch/
      manager.ts      # 批量处理管理
      worker.ts       # Web Worker 渲染
  ui/
    store.ts          # Petite-Vue 响应式状态
  main.ts             # 入口文件
index.html            # 主页面
styles.css            # 样式表
```

## 开发

```bash
npm install
npm run dev        # 启动开发服务器（热更新）
npm run build      # 生产构建
npm run preview    # 预览生产构建
```

## 架构

- **颜色引擎** (`palette.ts`)：逐像素采样 → HSL 量化 → 场景分析 → 主导色/强调色评分 → 柔化/主题偏移 → 对比度确保
- **渲染器** (`renderer.ts`)：Canvas 2D 合成 — 白色基底 → 有色背景区 → 照片图 → 文字叠加 → 黑线内描边
- **响应式 UI**：Petite-Vue `reactive()` 管理所有状态，`v-model` 双向绑定输入控件，状态变更自动触发 Canvas 重绘
- **批量处理**：Web Worker 中使用 OffscreenCanvas 并行渲染多张照片，完成后通过 JSZip 打包导出

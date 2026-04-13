# PhotoColors静态版v8

这是一个可直接部署到GitHub Pages的纯前端项目。

当前功能：
- 上传静态图片
- 自动取色生成上半部分背景
- 上下固定1:1布局
- 下半部分保留原图像素尺寸绘制
- 地址和时间支持实时编辑
- 可单独关闭地址或时间
- 可调整地点字号、时间字号、行间距
- 提供多组无衬线字体选择
- 字体颜色从图片中取色，并优先生成更跳脱、更鲜明的后现代风格强调色
- 一键导出PNG

## 本地预览

直接双击 `index.html` 即可打开。

或者在目录下启动本地服务器：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## GitHub Pages部署

1. 新建GitHub仓库
2. 把本目录文件上传到仓库根目录
3. 打开仓库 `Settings -> Pages`
4. Source选择 `Deploy from a branch`
5. Branch选择 `main`，目录选择 `/(root)`
6. 保存后等待Pages发布完成

## 注意

导出PNG会保持合成图的像素尺寸，但它是新的编码文件，不会原样保留原图全部EXIF、ICC、DPI等元数据。

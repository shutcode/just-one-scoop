# 就挖一勺 · 地心来信

离线单文件地心科学探险。自由挖掘，地球双地图，120 个独立知识主题与 12 种交互实验。

当前版本：**V11**（`11.0.0`）。深部穿行装备为科学幻想，局部尺度经过压缩；地球全景采用真实半径比例（平均半径 6,371 km），知识页会注明演示假设。

## 怎么玩

用浏览器打开 [`index.html`](index.html)，或直接打开 [`just_one_scoop_v11.html`](just_one_scoop_v11.html)。游戏画面、图片和实验都写在这一个 HTML 里，不需要安装依赖，也不需要联网。

本地预览也可以用任意静态服务器，例如：

```bash
python3 -m http.server 8080
```

然后访问 `http://127.0.0.1:8080/`。

如果文件管理器只显示预览、或当前环境禁用了 JavaScript，请把完整 HTML 用支持脚本的浏览器打开。

### 操作

| 操作 | 作用 |
| --- | --- |
| 按住鼠标或手指指向一个方向 | 朝该方向挖掘 |
| 方向键 | 键盘挖掘 |
| `E` | 研究附近的标本或观测点 |
| `K` | 科学手册 |
| `M` | 地图（洞穴局部 / 地球全景） |
| `Esc` | 设置与暂停 |

工具从考察勺开始。土层变硬后，刷子、钻头、扫描仪和水泵会更有用。能源、声音、画质和减弱动效都可以在暂停菜单里调整。

### 存档

进度自动保存在本机浏览器的 `localStorage`（键名 `scoop-v11-save`）。暂停菜单可以导出或导入 JSON 存档。存档格式为 `scoop-v11` / version `11`，不能直接导入旧版补丁存档。

## 仓库里有什么

| 文件 | 作用 |
| --- | --- |
| `just_one_scoop_v11.html` | 完整游戏。素材以 data URL 内嵌在页面里 |
| `index.html` | 入口页，跳转到游戏文件，供 GitHub Pages 使用 |
| `AGENTS.md` | 给后续改代码的代理看的约束 |
| `.github/workflows/ci.yml` | 检查入口页和游戏文件是否完整 |
| `.github/workflows/pages.yml` | 把静态页面发布到 GitHub Pages |

## 发布页面

推送到 `main` 后，GitHub Actions 会把 `index.html` 和游戏文件部署到 GitHub Pages。仓库需要把 Pages 的来源设为 **GitHub Actions**。

启用后的地址形如：

`https://shutcode.github.io/just-one-scoop/`

## 许可

本仓库尚未指定开源许可证。在加入 `LICENSE` 之前，保留所有权利。

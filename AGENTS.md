# AGENTS.md

本仓库是「就挖一勺 · 地球的层层谜题」V13：一个离线、单文件的浏览器游戏，整合现代地球连续挖掘与地标地质考察。

## 先看这些

- 可玩内容几乎全在 `just_one_scoop_v13_complete.html`。
- `index.html` 只负责跳转到游戏，方便 GitHub Pages。不要把游戏逻辑复制进入口页。
- 可维护源码在 `source/`，用 `python3 source/build.py` 重新打包单文件；不要手改交付 HTML 里被内嵌的长 base64，也不要整文件格式化。
- 界面文案是简体中文。新增玩家可见文字保持中文，并和现有语气一致：科学幻想探险，知识页标明演示假设。

## 运行与检查

不需要引入打包器。改源码后重新构建，或直接打开交付 HTML：

```bash
python3 source/build.py
python3 -m http.server 8080
```

浏览器打开 `http://127.0.0.1:8080/just_one_scoop_v13_complete.html`。改完后至少确认：开场可选玩法与难度、挖掘有反馈、科学手册和地图能打开、控制台没有新的脚本错误。

`file://` 可以直接玩。部分预览器会禁用脚本，失败提示已经写在页面里，不要删掉 `#fatal` 和 `<noscript>`。

## 不要破坏的约定

- 存档格式是 `scoop-v13`，`version` 为 `13`。四个 `localStorage` 键为 `scoop-v13-玩法-难度-save`。改快照字段时同步更新 `validate()`，并让旧档得到明确的格式错误，而不是静默丢档。
- 导入入口需继续支持迁移 `scoop-v11` / `scoop-v12`。
- 导出文件名保持与界面一致的 V13 存档命名。
- 深度换算使用 `GEO_Z` / `GEO_D` 和真实半径 `REAL_R = 6371`。洞穴局部尺度是压缩过的，地球全景才按真实半径。
- 知识节点目标数量是 174，交互实验族在 `LABS` 里目标 22，技能 22。改其中一边时核对开场文案里的数字。
- 调试入口是 `window.SCOOP`（`version`、`status`、`selfTest`）。保留它。
- 支持减弱动效、画质档位，以及 `localStorage` 被禁时改为提示导出存档。
- 历史参考：`just_one_scoop_v11.html` 与 `tests/fixtures/` 中的旧档仅用于迁移复核，不要把 V11 约定写回主玩法。

## 提交范围

玩家能玩到的变更才需要动交付 HTML 或 `source/`。文档、CI 和工作流改动不要顺手重排游戏文件。游戏文件约 1MB，diff 应以必要修改为主。

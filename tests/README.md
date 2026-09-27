# V13 测试说明

核心记录 `results.json` 来自交付 HTML，补充记录 `profile_results.json` 和 `webgl_results.json` 分别覆盖四档位 / 导入 / 100 km 冲刺，以及 WebGL 路径。

环境：Python Playwright，`/usr/bin/chromium`，WebGL 抽查使用 Xvfb 与 SwiftShader。安装运行环境不是游戏依赖。测试通过 `page.set_content` 注入自包含 HTML；不绕过运行器禁止的外部页面导航策略，也不把这当作所有 Android `content://` 查看器兼容证明。

在项目根目录运行：

```sh
python tests/qa_v13.py
python tests/qa_profiles.py
python tests/qa_webgl.py
```

`qa_v13.py` 的完整地球通关段持续执行正式 `Game.tick` 和 `DigController` / 碰撞逻辑，循环加速，不通过传送完成，也不渲染每一个模拟 tick。它验证连续地图与终点逻辑，不是 FPS、真实玩家通关时间或长时 GPU 性能测试。

`fixtures/v11-save.json` 与 `fixtures/v12-save.json` 由本次实际执行用户已有 V11/V12 HTML 后导出。源码包不重复包含旧版整个游戏，使用这些小型原始格式存档复核迁移。

移动检查为 390×844、DPR 2 的触摸和视口模拟，双指缩放使用 Chrome DevTools Touch 事件；不是 Android/iPhone 真机。

测试脚本为当前 Linux 环境配置。其他环境需调整 Chromium 和 Xvfb 路径。不包含浏览器、字体、Python/Node 软件包。

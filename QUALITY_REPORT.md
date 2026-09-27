# V13 双旅程整合版 · 交付验证

交付：`just_one_scoop_v13_complete.html`，**977,765 字节**。

SHA-256：`87edd77421a5205b9e87bde8d29b3b3ad559e574872c1010cd89a69dfb82fc1f`

## 本轮结果

- **28 组核心检查通过**：开场选择、现代完整航程、地标保留、方向、地图、知识、研究、难度和存档。
- **7 组补充检查通过**：四档位实际切换与重开隔离、100 km 冲刺、各深度门槛、真实文件选择器导入 V11 / V12 JSON。
- **3 组 WebGL 抽查通过**：现代挖掘、地标画面、研究与切换生命周期。
- `node --check source/game.js` 已执行通过。
- 核心测试页面脚本错误为空，正常运行没有外部资源请求。

## 核心目标：真的挖穿，而不是只增加深度数值

测试从地表出生点开始，持续送入方向输入，调用正式更新、工具姿态、切割和碰撞逻辑。

- 未调用传送完成航程，也未把地心作为终点。
- 经过内外核与地心后，沿同一世界继续到另一侧。
- 终点判定要求角色确实越过另一侧的物理地表半径。
- 本轮留下 **7,926 条地形修改**与 **5,740 个已挖微单元**。
- 保存 **10 个已到达接力记录**，包括出发、地心观测区和另一侧出口。
- 最接近地心距离约 **0.012800 km**；游戏的“地心观测区”明确采用 ±2 km 容差，不伪称整个区域都是精确零重力。
- 保存、恢复和返回已到达接力站后地形修改保持。

测试加速执行模拟更新，未渲染每个模拟步；不能据此承诺“若干分钟通关”、60 FPS 或所有设备的长时性能。源码中的 `worldGeo / geoWorld` 圈层尺度与局部画面存在压缩映射；坐标不是实地导航数据。

## 源码整合而非多份游戏嵌套

只有一套 Game / World / DigController / Renderer / MapSystem 与 ScienceSystem。`session.js` 管理主菜单和四档位；`journey.js` 管理现代地球阶段、接力、装备检查、方向辅助与完成条件；地标沿用 `geology.js / expedition.js`。

UI 先选现代地球或地标考察，再选探索或地狱。每个档位的世界、角色位置、研究点、技能和报告独立保存；切换使用深拷贝快照，不会意外引用同一个可变对象。

## 本轮修复与回归

- 初始出口阈值过早约 100 m，改为真正越过地表后通关，已重新跑完整航程。
- 开场数据选择器误包含外层容器，绑定改为明确的按钮选择器。
- 长旅程后恢复短时存档时，HUD / 小地图与提示时间戳会过期；恢复时统一重置刷新计时、收起旧提示，回归检查通过。
- 存档缓存读取和写入都深拷贝，避免不同档位共享引用。

## 环境与边界

主测试：Chromium headless、Canvas 2D 兼容渲染；桌面 1366×920，手机 390×844 / DPR2 / 触摸模拟。

WebGL：Xvfb 中的 headed Chromium + ANGLE SwiftShader 软件 WebGL 2。确认了实际 WebGL 路径，而不是只检查接口名字。截图来自实际页面。不是独立显卡或手机 GPU 性能测试。

运行器限制外部页面导航，因此采用 DOM 注入加载交付的完整 HTML。不能持久使用 localStorage 的隔离上下文下测试了会话内四档位、JSON 序列化/恢复、真实文件选择器导入；没有声称完成跨浏览器重启的磁盘存储验收。

尚未覆盖：全部 Android/iOS 真机和文件预览器、Safari 全版本、数小时地图压力和耗电、完整地学专家审校、长期难度平衡、商业发行验收。风格化 2.5D 画面不宣称等同电影离线渲染。

## 内容数量

174 个独立知识主题，22 类实验，22 项技能，20 类材料 / 矿物组 / 合金数据，14 个年代条目。

现代为完整地球主模式；地标为八个目的地（含营地）。不是 174 个不同实验，也不是 20 种都可开采的矿石。现代浅层沉积窗口是教学重建，深部是科学幻想通行和证据研究。

## 逐项结果

| 组别 | 检查 | 结果 |
|---|---|---|
| 核心 | launcher: two campaigns, two difficulties, gameplay paused | PASS |
| 核心 | modern starts on continuous Earth, not field-camp | PASS |
| 核心 | eight-direction bowl and tip both face forward | PASS |
| 核心 | continuous directional digging and camera follow | PASS |
| 核心 | modern fossil hosts valid, diverse minerals, no deep fossils | PASS |
| 核心 | profile storage has no mutable shared references | PASS |
| 核心 | field profile begins independently | PASS |
| 核心 | eight field destinations preserve geology and per-region excavation | PASS |
| 核心 | return to modern restores same location and route | PASS |
| 核心 | hell starts at surface without impossible initial gate | PASS |
| 核心 | depth and dash gates block before consuming inventory | PASS |
| 核心 | equipment + current-stage survey enables work; repeat survey cannot farm | PASS |
| 核心 | survival pauses in panels and free rescue cannot softlock | PASS |
| 核心 | difficulty profiles retain independent research, skills, world | PASS |
| 核心 | 10 km dash carves actual world, not a depth counter | PASS |
| 核心 | geography roundtrip valid in both hemispheres | PASS |
| 核心 | 174 science pages, 22 interactive labs, no duplicate canvases | PASS |
| 核心 | modern fossil dossier stores layers/methods and rewards once | PASS |
| 核心 | nonblocking discovery toast closes itself | PASS |
| 核心 | Earth/cave maps: buttons, wheel, pan, fit and switch | PASS |
| 核心 | full route through Earth uses real controller/collision, no teleportation | PASS |
| 核心 | complete map and relay stations survive JSON restore | PASS |
| 核心 | import actual V11 save into correct V13 campaign | PASS |
| 核心 | import actual V12 save into correct V13 campaign | PASS |
| 核心 | restore after long expedition resets HUD and minimap timers | PASS |
| 核心 | reject invalid campaign or coordinates | PASS |
| 核心 | no script errors and no external runtime requests | PASS |
| 核心 | mobile menu usability and pinch zoom, no horizontal overflow | PASS |
| 补充 | all four opening selections store isolated complete snapshots | PASS |
| 补充 | restarting one slot leaves the other three unchanged | PASS |
| 补充 | 100 km vehicle cuts world without normal-loot pity inflation | PASS |
| 补充 | every deep Earth difficulty stage checks distinct prerequisites | PASS |
| 补充 | actual file-chooser import V11 JSON | PASS |
| 补充 | actual file-chooser import V12 JSON | PASS |
| 补充 | supplemental tests have no browser errors | PASS |
| WebGL | WebGL modern rendering and digging | PASS |
| WebGL | WebGL field and modern workshop share engine | PASS |
| WebGL | WebGL mode switching and experiment lifecycle | PASS |

原始记录见 `tests/results.json`、`tests/profile_results.json` 和 `tests/webgl_results.json`。

# 样式结构说明

全局样式按职责拆分为多个 partial，由 `index.scss` 统一引入，保证顺序与可维护性。

## 文件职责

| 文件 | 职责 |
|------|------|
| `_variables.scss` | 设计令牌（`:root` 变量）、浅色/深色主题 |
| `_reset.scss` | 基础样式重置 |
| `_base.scss` | 全局元素（html、body、a、button）及减少动效 |
| `_animations.scss` | 全局共享 keyframes（如 `pop-in`、`fade-in`） |
| `_modal.scss` | 通用弹窗样式（MenuModal / LoginModal / RegisterModal 共用） |
| `index.scss` | 入口，按顺序 `@use` 上述 partial |

## 组件样式

- **Board**、**Header**、**AIAssistant** 仍在各自目录下保留 `index.scss`，仅负责组件自身样式。
- 弹窗类组件不再单独引入样式，统一使用 `_modal.scss` 中的类名。

## 使用变量

在任意 SCSS 或 CSS 中通过 `var(--name)` 使用，例如：

- `var(--color-bg)`、`var(--color-text)`、`var(--accent)`
- `var(--surface)`、`var(--surface-border)`、`var(--error)`（面板/弹窗）
- `var(--board-bg)`、`var(--t-2048-bg)` 等棋盘与数字块颜色

新增颜色或间距时，优先在 `_variables.scss` 中增加令牌，再在组件中引用。

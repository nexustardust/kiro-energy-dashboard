# Implementation Plan: 智慧能源管理儀表板

## Overview

依照設計文件，將儀表板拆分為四個主要任務依序實作：
1. 建立 HTML 頁面結構
2. 撰寫 CSS 版面與樣式
3. 實作 JavaScript 資料層、邏輯與 SVG 趨勢圖
4. 整合驗收——確認所有需求均已滿足

---

## Tasks

- [x] 1. 建立 HTML 頁面結構（`docs/index.html`）
  - 建立 `docs/` 資料夾，新增 `index.html`
  - 加入頁首（`<header>`），標題文字「智慧能源管理儀表板」
  - 加入摘要卡片區（`<section class="summary-section">`），包含 4 個 `<div class="card">` 佔位元素：
    - `id="card-today-kwh"`（今日用電）
    - `id="card-month-kwh"`（本月用電）
    - `id="card-today-co2"`（今日碳排放）
    - `id="card-month-co2"`（本月碳排放）
  - 加入趨勢圖區（`<section class="chart-section">`）：
    - 切換按鈕列：`<button id="btn-hourly">` 與 `<button id="btn-daily">`
    - `<svg id="trend-chart" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">`（內容由 JS 注入）
  - 加入設備狀態區（`<section class="device-section">`）：
    - `<h2>` 含 `<span id="anomaly-count">`
    - `<ul id="device-list">`（項目由 JS 注入）
  - 以相對路徑連結 `styles.css`（`<link>`）與 `app.js`（`<script defer>`）
  - 所有靜態文字使用繁體中文
  - _需求對應：1.1、1.3、2.2、3.2、4.1、4.4_
  - 前置依賴：無
  - 驗收：在瀏覽器開啟 `docs/index.html`，頁面可正常載入，結構標籤正確存在（可透過 DevTools 確認元素 id）

- [x] 2. 撰寫 CSS 版面與樣式（`docs/styles.css`）
  - [x] 2.1 建立 CSS 變數與基礎重置
    - 新增 `docs/styles.css`
    - 定義 `:root` CSS Custom Properties（`--color-primary`、`--color-anomaly`、`--color-offline`、`--color-normal`、`--color-bg`、`--color-card-bg`）
    - 加入全域 `box-sizing: border-box`
    - _需求對應：1.3、4.2_
    - 前置依賴：任務 1

  - [x] 2.2 實作摘要卡片與頁首版型
    - 頁首 Flexbox 置中排版
    - 卡片區使用 CSS Grid（桌機 4 欄）；768px 以下改為 2 欄
    - 卡片樣式：白色背景、圓角、陰影，`card-label` 與 `card-value` 字型大小
    - _需求對應：1.3、2.2_
    - 前置依賴：2.1

  - [x] 2.3 實作趨勢圖區、按鈕與 RWD 自適應
    - 切換按鈕預設與 `.active` 狀態樣式
    - `<svg>` 設定 `width: 100%`，在 768px 以下自適應縮放
    - _需求對應：3.4、3.5_
    - 前置依賴：2.1

  - [x] 2.4 實作設備列表狀態樣式
    - `.status-anomaly`：醒目警示色（`--color-anomaly`，紅色 / 橘色）
    - `.status-offline`：灰色文字（`--color-offline`）
    - `.status-normal`：正常色（`--color-normal`）
    - `.badge-anomaly` 徽章樣式
    - _需求對應：4.2、4.3、4.6_
    - 前置依賴：2.1

  - 驗收（任務 2 整體）：搭配任務 1 的 HTML，頁面在 1280px 與 375px 寬度下版型均符合設計文件截圖，卡片、SVG 區與設備列表各自對齊

- [x] 3. 實作 JavaScript 資料層與互動邏輯（`docs/app.js`）
  - [x] 3.1 定義模擬資料常數
    - 新增 `docs/app.js`
    - 定義 `SUMMARY_DATA`（今日 / 本月用電量，含 `null` 缺失值情境）
    - 定義 `TREND_DATA`（`hourly` 24 筆、`daily` 30 筆，含少於 2 筆的邊界情境）
    - 定義 `DEVICE_DATA`（至少 6 台，包含 `normal`、`anomaly`、`offline` 三種狀態）
    - _需求對應：1.1、1.2、3.1、4.1_
    - 前置依賴：任務 1

  - [x] 3.2 實作 `calcCarbon(kwh)` 與 `renderSummaryCards()`
    - `calcCarbon(kwh)`：回傳 `(kwh * 0.502).toFixed(2)`；`kwh` 為 0 時回傳 `'0.00'`
    - `renderSummaryCards()`：讀取 `SUMMARY_DATA`，依序填入 4 張卡片的 `.card-number`；欄位缺失時顯示「資料未提供」
    - _需求對應：1.1、1.2、1.5、1.6、2.1、2.2、2.4、2.5_
    - 前置依賴：3.1

  - [x] 3.3 實作 `drawTrendChart(mode)` SVG 折線圖
    - 函式依 `mode`（`'hourly'` / `'daily'`）取出對應資料陣列
    - 計算 `scaleX`、`scaleY`，產生 `<polyline points="…">`
    - 注入 X 軸時間標籤（`<text>`）、Y 軸數值標籤（`<text>`），字型大小 ≥ 12px
    - 注入水平格線（`<line class="grid-line">`）
    - 資料點少於 2 筆時，注入提示文字「資料不足，無法繪製趨勢圖」取代折線
    - 每次呼叫前先清空 SVG 的 `innerHTML`
    - _需求對應：3.1、3.3、3.4、3.6_
    - 前置依賴：3.1

  - [x] 3.4 實作切換按鈕事件與 `renderDeviceList()` / `updateAnomalyCount()`
    - 為 `#btn-hourly` 與 `#btn-daily` 綁定 `click` 事件，切換 `.active` 並呼叫 `drawTrendChart(mode)`，切換須在 300ms 內完成重繪
    - `renderDeviceList()`：依 `anomaly → offline → normal` 順序排序 `DEVICE_DATA` 後，產生 `<li>` 並注入 `#device-list`；`offline` 設備用電量顯示「—」
    - `updateAnomalyCount()`：統計 `anomaly` 數量，更新 `#anomaly-count` 文字；全部正常時另顯示「所有設備運作正常」提示列
    - _需求對應：3.2、3.3、4.1、4.2、4.3、4.4、4.5、4.6_
    - 前置依賴：3.2、3.3

  - [x] 3.5 實作入口函式 `initDashboard()`
    - 監聽 `DOMContentLoaded`，依序呼叫：`renderSummaryCards()`、`drawTrendChart('hourly')`、`renderDeviceList()`、`updateAnomalyCount()`
    - 確認所有渲染在資料載入後 500ms 內完成
    - _需求對應：1.4、3.1_
    - 前置依賴：3.2、3.3、3.4

  - 驗收（任務 3 整體）：在瀏覽器開啟 `docs/index.html`，4 張卡片數值正確、SVG 折線圖顯示、切換按鈕運作、設備列表依優先順序呈現，DevTools Console 無錯誤

- [ ] 4. 整合驗收與邊界情境確認
  - [ ] 4.1 驗證缺失資料與邊界情境
    - 將 `SUMMARY_DATA.today.kwh` 暫設為 `null`，確認卡片顯示「資料未提供」且其餘卡片不受影響（需求 1.5、1.6）
    - 將 `TREND_DATA.hourly` 暫縮為 1 筆，確認 SVG 顯示提示文字（需求 3.6）
    - 將 `DEVICE_DATA` 所有 status 設為 `'normal'`，確認顯示「所有設備運作正常」（需求 4.5）
    - 還原模擬資料至原始值
    - _需求對應：1.5、1.6、3.6、4.5_
    - 前置依賴：任務 3

  - [ ] 4.2 RWD 與視覺驗收
    - 以 DevTools 模擬 375px 寬度，確認卡片改為 2 欄、SVG 自適應縮放、設備列表不截斷（需求 3.5）
    - 確認異常設備列表項目以醒目色標示、離線設備以灰色顯示（需求 4.2、4.3）
    - _需求對應：3.5、4.2、4.3_
    - 前置依賴：4.1

  - 驗收（任務 4 整體）：所有需求驗收條件均通過，`docs/` 下僅含 `index.html`、`styles.css`、`app.js` 三個檔案，無外部套件依賴

---

## Notes

- 本計畫最多四個主任務，所有子任務均隸屬其下，避免孤立程式碼
- 趨勢圖以原生 SVG 實作（非 Canvas），符合設計文件規格
- 模擬資料全數定義於 `app.js` 常數中，不串接外部 API
- 子任務之間的前置依賴已明確標示，實作時請依序進行
- 本計畫不含部署、效能分析或使用者訓練等非程式碼任務

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "2.4", "3.1"] },
    { "id": 2, "tasks": ["3.2"] },
    { "id": 3, "tasks": ["3.3"] },
    { "id": 4, "tasks": ["3.4"] },
    { "id": 5, "tasks": ["3.5"] },
    { "id": 6, "tasks": ["4.1"] },
    { "id": 7, "tasks": ["4.2"] }
  ]
}
```

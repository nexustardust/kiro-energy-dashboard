# 技術設計文件：智慧能源管理儀表板

## 概述

本系統為純靜態單頁網頁應用程式，以三個檔案組成，全部放置於 `docs/` 資料夾：

```
docs/
├── index.html   ← 頁面結構與語意標記
├── styles.css   ← 視覺樣式與版型
└── app.js       ← 模擬資料與所有互動邏輯
```

不引入任何外部套件或 CDN，所有資源使用相對路徑，趨勢圖以原生 SVG 實作。

---

## 架構設計

### 整體運作流程

```
瀏覽器載入 index.html
  └─ 載入 styles.css（樣式）
  └─ 載入 app.js（資料 + 邏輯）
        └─ 頁面 DOMContentLoaded 事件觸發
              ├─ 渲染用電量卡片（今日 / 本月）
              ├─ 渲染碳排放量卡片（今日 / 本月）
              ├─ 繪製 SVG 趨勢圖（預設：每小時）
              └─ 渲染設備狀態列表
```

### 資料層（app.js）

所有資料以 JavaScript 物件常數定義，分為三組：

**1. 用電摘要資料**
```js
const SUMMARY_DATA = {
  today: { kwh: 312.5 },
  month: { kwh: 8740.2 }
};
```

**2. 趨勢圖資料**
```js
const TREND_DATA = {
  hourly: [
    { label: '00:00', kwh: 12.3 },
    // ... 共 24 筆
  ],
  daily: [
    { label: '10/1', kwh: 280.0 },
    // ... 共 30 筆
  ]
};
```

**3. 設備狀態資料**
```js
const DEVICE_DATA = [
  { name: '空調系統 A', kwh: 45.2, threshold: 40, status: 'anomaly' },
  { name: '伺服器機房',  kwh: 0,    threshold: 30, status: 'offline' },
  { name: '照明系統',   kwh: 18.7, threshold: 25, status: 'normal'  },
  // ... 共 6 台設備
];
```

`status` 欄位為 `'normal'`、`'anomaly'`、`'offline'` 三種值之一。碳排放量不存於資料中，由前端計算：`碳排放 = kwh × 0.502`。

---

## 元件設計

### 1. 摘要資訊卡（Summary Cards）

共 4 張卡片，兩兩一組排列：

| 卡片 | 標題 | 數值來源 | 單位 |
|------|------|---------|------|
| 今日用電量 | 今日用電 | `SUMMARY_DATA.today.kwh` | kWh |
| 本月用電量 | 本月用電 | `SUMMARY_DATA.month.kwh` | kWh |
| 今日碳排放 | 今日碳排放 | `today.kwh × 0.502` | kg CO₂ |
| 本月碳排放 | 本月碳排放 | `month.kwh × 0.502` | kg CO₂ |

HTML 結構（以今日用電為例）：
```html
<div class="card" id="card-today-kwh">
  <p class="card-label">今日用電</p>
  <p class="card-value"><span class="card-number">312.5</span> kWh</p>
</div>
```

缺失資料處理：若對應欄位為 `null` 或 `undefined`，顯示「資料未提供」。

---

### 2. SVG 趨勢圖（Trend Chart）

以原生 SVG 繪製折線圖，不使用 Canvas。

**SVG 容器結構：**
```html
<section class="chart-section">
  <div class="chart-controls">
    <button id="btn-hourly" class="active">每小時</button>
    <button id="btn-daily">每日</button>
  </div>
  <svg id="trend-chart" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
    <!-- 由 app.js 動態注入 -->
  </svg>
</section>
```

**繪圖邏輯（app.js）：**

`drawTrendChart(mode)` 函式負責繪製，`mode` 為 `'hourly'` 或 `'daily'`：

1. 取出對應資料陣列
2. 計算 X / Y 座標的縮放比例（`scaleX`、`scaleY`）
3. 產生 SVG `<polyline>` 的 `points` 屬性字串
4. 注入 X 軸標籤（`<text>`）與 Y 軸標籤（`<text>`）
5. 注入格線（`<line class="grid-line">`）
6. 清空舊有內容後以 `innerHTML` 替換

資料點少於 2 筆時，改注入提示文字：
```html
<text x="400" y="150" text-anchor="middle">資料不足，無法繪製趨勢圖</text>
```

**SVG 視覺配置：**
- 繪圖區域：左側 50px 為 Y 軸標籤區、底部 40px 為 X 軸標籤區
- 折線顏色：`#4a90d9`，`stroke-width: 2`
- 格線顏色：`#e0e0e0`
- 標籤字型：系統預設 sans-serif，12px

---

### 3. 設備狀態列表（Device Status）

依狀態優先順序排序後渲染：`anomaly` → `offline` → `normal`。

**HTML 結構：**
```html
<section class="device-section">
  <h2>設備狀態 <span id="anomaly-count" class="badge-anomaly">異常設備：1 台</span></h2>
  <ul class="device-list" id="device-list">
    <!-- 由 app.js 動態注入 <li> -->
  </ul>
</section>
```

**每筆設備項目（`<li>`）：**
```html
<li class="device-item status-anomaly">
  <span class="device-name">空調系統 A</span>
  <span class="device-kwh">45.2 kWh</span>
  <span class="device-status">異常</span>
</li>
```

| `status` 值 | CSS 類別 | 狀態文字 | 用電量顯示 |
|------------|---------|---------|-----------|
| `normal`   | `status-normal`  | 正常 | 實際數值 kWh |
| `anomaly`  | `status-anomaly` | 異常 | 實際數值 kWh |
| `offline`  | `status-offline` | 離線 | `—` |

全部正常時，異常計數顯示「異常設備：0 台」，並額外顯示「所有設備運作正常」提示列。

---

## 頁面版型（index.html）

```
┌─────────────────────────────────────┐
│  頁首：智慧能源管理儀表板              │
├─────────────────────────────────────┤
│  [今日用電] [本月用電] [今日碳排] [本月碳排]  │  ← 4 欄卡片
├─────────────────────────────────────┤
│  能源使用趨勢  [每小時] [每日]          │
│  ┌─────────────────────────────┐    │
│  │  SVG 折線圖                  │    │
│  └─────────────────────────────┘    │
├─────────────────────────────────────┤
│  設備狀態  異常設備：N 台              │
│  ● 空調系統 A    45.2 kWh   [異常]   │
│  ● 伺服器機房    —          [離線]   │
│  ● 照明系統      18.7 kWh   [正常]   │
└─────────────────────────────────────┘
```

RWD 斷點：768px 以下，卡片由 4 欄改為 2 欄，趨勢圖 SVG 以 `width: 100%` 自適應縮放。

---

## CSS 設計原則（styles.css）

- 使用 CSS Custom Properties（變數）定義色票：
  ```css
  :root {
    --color-primary:  #4a90d9;
    --color-anomaly:  #e74c3c;
    --color-offline:  #95a5a6;
    --color-normal:   #27ae60;
    --color-bg:       #f0f2f5;
    --color-card-bg:  #ffffff;
  }
  ```
- 版型以 CSS Grid 為主（卡片區）、Flexbox 為輔（頁首、按鈕列）
- 不使用任何 CSS 框架或重置套件，僅加入最精簡的 `box-sizing: border-box` 全域設定

---

## 函式清單（app.js）

| 函式名稱 | 說明 |
|---------|------|
| `initDashboard()` | 頁面入口，DOMContentLoaded 時呼叫 |
| `renderSummaryCards()` | 渲染 4 張摘要資訊卡 |
| `calcCarbon(kwh)` | 計算碳排放量，回傳 `(kwh * 0.502).toFixed(2)` |
| `drawTrendChart(mode)` | 依 mode 繪製 SVG 折線圖 |
| `renderDeviceList()` | 依優先順序排序並渲染設備列表 |
| `updateAnomalyCount()` | 統計並更新異常設備數量顯示 |

---

## 檔案相依關係

```
index.html
  ├── <link rel="stylesheet" href="styles.css">   ← 相對路徑
  └── <script src="app.js" defer></script>         ← 相對路徑，defer 確保 DOM 就緒後執行
```

---

## 不在範圍內（Out of Scope）

- 登入 / 權限控制
- 後端 API 或資料庫
- 即時資料更新（WebSocket / Polling）
- 多語系
- 單元測試

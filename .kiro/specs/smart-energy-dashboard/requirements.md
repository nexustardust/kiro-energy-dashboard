# Requirements Document

## Introduction

智慧能源管理儀表板是一套供公司內部能源管理人員使用的單頁網頁應用程式。  
系統以純 HTML、CSS、JavaScript 實作，採用模擬資料（mock data），無需後端服務或資料庫。  
核心目標是讓能源管理人員能即時掌握公司整體用電狀況、預估碳排放、檢視趨勢變化，並及時發現設備異常，解決過去無法快速取得全貌的問題。

## Glossary

- **儀表板（Dashboard）**：本系統的主要網頁介面，呈現所有能源相關資訊的單一頁面
- **用電量（EnergyConsumption）**：以度（kWh）為單位的電力消耗數值
- **碳排放量（CarbonEmission）**：依用電量換算得出的二氧化碳排放估計值，單位為公斤（kg CO₂）
- **趨勢圖（TrendChart）**：以時間軸為橫軸、用電量為縱軸的視覺化圖表，使用原生 Canvas API 實作
- **設備（Device）**：公司內部被監控的用電設備，例如空調、伺服器機房、照明系統等
- **異常狀態（Anomaly）**：設備用電量超過預設閾值，或設備離線時所觸發的警示狀態
- **模擬資料（MockData）**：直接定義在 JavaScript 程式碼中的靜態資料物件，用以模擬真實系統回傳的數值
- **能源管理人員（EnergyManager）**：本系統的主要使用者，負責監控與分析公司能源使用情形

---

## Requirements

### Requirement 1: 今日及本月用電量顯示

**User Story:** 身為能源管理人員，我希望在儀表板上看到今日與本月的累計用電量，以便快速掌握目前的用電進度。

#### Acceptance Criteria

1. THE Dashboard SHALL 在頁面載入時，於顯著位置呈現今日累計用電量數值（單位：kWh）。
2. THE Dashboard SHALL 在頁面載入時，於顯著位置呈現本月累計用電量數值（單位：kWh）。
3. THE Dashboard SHALL 將今日用電量與本月用電量分別以獨立的資訊卡（card）元件呈現，兩者並排顯示。
4. WHEN 模擬資料載入完成，THE Dashboard SHALL 在 500 毫秒內完成今日及本月用電量的畫面渲染。
5. IF 模擬資料中今日用電量欄位缺失，THEN THE Dashboard SHALL 以「資料未提供」文字取代數值顯示，並保持其餘資訊正常呈現。
6. IF 模擬資料中本月用電量欄位缺失，THEN THE Dashboard SHALL 以「資料未提供」文字取代數值顯示，並保持其餘資訊正常呈現。

---

### Requirement 2: 預估碳排放量

**User Story:** 身為能源管理人員，我希望看到依用電量換算的預估碳排放量，以便評估公司的碳足跡並採取節能措施。

#### Acceptance Criteria

1. THE Dashboard SHALL 依照公式「碳排放量（kg CO₂）= 用電量（kWh）× 0.502」計算今日及本月的預估碳排放量。
2. THE Dashboard SHALL 將今日預估碳排放量與本月預估碳排放量分別以獨立資訊卡呈現，並標示單位（kg CO₂）。
3. WHEN 今日用電量數值更新，THE Dashboard SHALL 同步更新今日預估碳排放量的顯示數值。
4. THE Dashboard SHALL 將碳排放量數值四捨五入至小數點後兩位再顯示。
5. IF 用電量數值為零，THEN THE Dashboard SHALL 顯示碳排放量為 0.00 kg CO₂，而非顯示錯誤或空白。

---

### Requirement 3: 能源使用趨勢圖

**User Story:** 身為能源管理人員，我希望透過趨勢圖觀察過去一段時間的用電量變化，以便識別用電高峰與低谷，進而調整用電策略。

#### Acceptance Criteria

1. THE TrendChart SHALL 以原生 Canvas API 繪製折線圖，橫軸為時間（最近 24 小時或最近 30 天），縱軸為用電量（kWh）。
2. THE Dashboard SHALL 提供「每小時」與「每日」兩種時間粒度的切換按鈕，讓使用者選擇趨勢圖的顯示範圍。
3. WHEN 使用者點擊時間粒度切換按鈕，THE TrendChart SHALL 在 300 毫秒內重新繪製對應時間範圍的趨勢資料。
4. THE TrendChart SHALL 顯示橫軸時間標籤與縱軸數值標籤，標籤文字清晰可辨，字型大小不小於 12px。
5. THE TrendChart SHALL 依螢幕寬度自適應調整圖表尺寸，在寬度 768px 以上的畫面與寬度 768px 以下的畫面均可正常顯示。
6. IF 指定時間範圍內的模擬資料點數少於 2 筆，THEN THE TrendChart SHALL 顯示「資料不足，無法繪製趨勢圖」提示文字，取代圖表畫布。

---

### Requirement 4: 設備狀態與異常提醒

**User Story:** 身為能源管理人員，我希望在儀表板上看到各設備的目前狀態，並在設備出現異常時立即收到提醒，以便快速響應並避免能源浪費或設備損壞。

#### Acceptance Criteria

1. THE Dashboard SHALL 以列表或卡片方式顯示所有受監控設備的名稱、目前用電量（kWh）及運作狀態（正常 / 異常 / 離線）。
2. WHEN 設備用電量超過該設備預設閾值，THE Dashboard SHALL 將該設備的狀態標示為「異常」，並以醒目的警示顏色（紅色或橘色）顯示。
3. WHEN 設備狀態為離線，THE Dashboard SHALL 將該設備的狀態標示為「離線」，並以灰色文字顯示，用電量欄位顯示「—」。
4. THE Dashboard SHALL 在頁面頂部或固定位置顯示目前異常設備總數，格式為「異常設備：N 台」，其中 N 為目前異常設備數量。
5. IF 所有設備均處於正常狀態，THEN THE Dashboard SHALL 顯示「所有設備運作正常」提示，異常設備計數顯示為 0。
6. THE Dashboard SHALL 依狀態優先順序排列設備清單：異常設備排列於最前，其次為離線設備，最後為正常設備。

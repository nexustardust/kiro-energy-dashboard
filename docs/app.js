/* =====================================================
   智慧能源管理儀表板 — 應用程式邏輯
   檔案：docs/app.js
   資料全為模擬資料（mock data），無後端連線
   ===================================================== */

'use strict';

/* ── 1. 模擬資料（Mock Data） ─────────────────────── */

/** 今日與本月用電量摘要 */
const SUMMARY_DATA = {
  today: { kwh: 312.5 },
  month: { kwh: 8740.2 }
};

/** 趨勢圖資料：每小時（24 筆）與每日（30 筆） */
const TREND_DATA = {
  hourly: [
    { label: '00:00', kwh: 10.2 }, { label: '01:00', kwh: 8.7  },
    { label: '02:00', kwh: 7.9  }, { label: '03:00', kwh: 7.5  },
    { label: '04:00', kwh: 8.1  }, { label: '05:00', kwh: 9.3  },
    { label: '06:00', kwh: 13.8 }, { label: '07:00', kwh: 18.2 },
    { label: '08:00', kwh: 22.5 }, { label: '09:00', kwh: 25.1 },
    { label: '10:00', kwh: 27.4 }, { label: '11:00', kwh: 28.9 },
    { label: '12:00', kwh: 26.3 }, { label: '13:00', kwh: 24.7 },
    { label: '14:00', kwh: 27.8 }, { label: '15:00', kwh: 29.2 },
    { label: '16:00', kwh: 28.5 }, { label: '17:00', kwh: 25.6 },
    { label: '18:00', kwh: 21.3 }, { label: '19:00', kwh: 19.8 },
    { label: '20:00', kwh: 17.4 }, { label: '21:00', kwh: 15.2 },
    { label: '22:00', kwh: 13.1 }, { label: '23:00', kwh: 11.5 }
  ],
  daily: [
    { label: '10/1',  kwh: 285.4 }, { label: '10/2',  kwh: 291.7 },
    { label: '10/3',  kwh: 278.3 }, { label: '10/4',  kwh: 265.9 },
    { label: '10/5',  kwh: 258.1 }, { label: '10/6',  kwh: 302.4 },
    { label: '10/7',  kwh: 318.6 }, { label: '10/8',  kwh: 295.2 },
    { label: '10/9',  kwh: 287.8 }, { label: '10/10', kwh: 310.1 },
    { label: '10/11', kwh: 325.4 }, { label: '10/12', kwh: 298.7 },
    { label: '10/13', kwh: 272.5 }, { label: '10/14', kwh: 261.3 },
    { label: '10/15', kwh: 305.9 }, { label: '10/16', kwh: 319.2 },
    { label: '10/17', kwh: 334.8 }, { label: '10/18', kwh: 312.5 },
    { label: '10/19', kwh: 288.4 }, { label: '10/20', kwh: 275.1 },
    { label: '10/21', kwh: 263.7 }, { label: '10/22', kwh: 291.6 },
    { label: '10/23', kwh: 308.3 }, { label: '10/24', kwh: 322.9 },
    { label: '10/25', kwh: 297.4 }, { label: '10/26', kwh: 281.8 },
    { label: '10/27', kwh: 269.5 }, { label: '10/28', kwh: 304.2 },
    { label: '10/29', kwh: 316.7 }, { label: '10/30', kwh: 312.5 }
  ]
};

/**
 * 設備狀態資料
 * status: 'normal' | 'anomaly' | 'offline'
 * threshold: 用電量異常閾值（kWh）
 */
const DEVICE_DATA = [
  { name: '空調系統 A', kwh: 45.2, threshold: 40, status: 'anomaly' },
  { name: '空調系統 B', kwh: 38.1, threshold: 40, status: 'normal'  },
  { name: '伺服器機房',  kwh: 0,    threshold: 30, status: 'offline' },
  { name: '照明系統',   kwh: 18.7, threshold: 25, status: 'normal'  },
  { name: '電梯設備',   kwh: 12.4, threshold: 20, status: 'normal'  },
  { name: '生產線 A',   kwh: 67.3, threshold: 60, status: 'anomaly' }
];

/* ── 2. 工具函式 ───────────────────────────────────── */

/**
 * 計算預估碳排放量
 * @param {number} kwh - 用電量（kWh）
 * @returns {string} 碳排放量（kg CO₂），四捨五入至小數點後兩位
 */
function calcCarbon(kwh) {
  if (kwh === null || kwh === undefined || isNaN(kwh)) return null;
  return (kwh * 0.502).toFixed(2);
}

/**
 * 安全取得數值，缺失時回傳 null
 * @param {*} val
 * @returns {number|null}
 */
function safeNum(val) {
  if (val === null || val === undefined || isNaN(val)) return null;
  return val;
}

/* ── 3. 渲染摘要卡片 ──────────────────────────────── */

/**
 * 更新單張卡片的數值
 * @param {string} cardId - 卡片元素 id
 * @param {number|null} value - 要顯示的數值（null 時顯示「資料未提供」）
 */
function updateCard(cardId, value) {
  const card = document.getElementById(cardId);
  if (!card) return;
  const numEl = card.querySelector('.card-number');
  if (!numEl) return;

  if (value === null) {
    numEl.textContent = '資料未提供';
    numEl.classList.add('no-data');
  } else {
    // 碳排放數值需保留兩位小數；整數（用電量）不加小數點
    const formatted = Number.isInteger(value)
      ? value.toLocaleString('zh-TW')
      : value.toLocaleString('zh-TW', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    numEl.textContent = formatted;
    numEl.classList.remove('no-data');
  }
}

/** 渲染 4 張摘要資訊卡 */
function renderSummaryCards() {
  const todayKwh  = safeNum(SUMMARY_DATA.today?.kwh);
  const monthKwh  = safeNum(SUMMARY_DATA.month?.kwh);
  const todayCo2  = todayKwh  !== null ? parseFloat(calcCarbon(todayKwh))  : null;
  const monthCo2  = monthKwh  !== null ? parseFloat(calcCarbon(monthKwh))  : null;

  updateCard('card-today-kwh',  todayKwh);
  updateCard('card-month-kwh',  monthKwh);
  updateCard('card-today-co2',  todayCo2);
  updateCard('card-month-co2',  monthCo2);
}

/* ── 4. SVG 趨勢圖 ────────────────────────────────── */

// SVG viewBox 尺寸
const SVG_W = 800;
const SVG_H = 300;
// 繪圖區域邊距（為軸線標籤留空間）
const MARGIN = { top: 20, right: 20, bottom: 45, left: 55 };

/**
 * 以 SVG namespace 建立元素
 * @param {string} tag
 * @param {Object} attrs
 * @returns {SVGElement}
 */
function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

/**
 * 繪製 SVG 趨勢折線圖
 * @param {'hourly'|'daily'} mode
 */
function drawTrendChart(mode) {
  const svg = document.getElementById('trend-chart');
  if (!svg) return;

  // 清空舊內容
  svg.innerHTML = '';

  const data = TREND_DATA[mode];

  // 資料不足時顯示提示
  if (!data || data.length < 2) {
    const txt = svgEl('text', {
      x: SVG_W / 2, y: SVG_H / 2,
      'text-anchor': 'middle',
      'dominant-baseline': 'middle',
      fill: '#7f8c8d', 'font-size': '14'
    });
    txt.textContent = '資料不足，無法繪製趨勢圖';
    svg.appendChild(txt);
    return;
  }

  const plotW = SVG_W - MARGIN.left - MARGIN.right;
  const plotH = SVG_H - MARGIN.top  - MARGIN.bottom;

  // 計算資料範圍
  const values  = data.map(d => d.kwh);
  const maxVal  = Math.max(...values);
  const minVal  = Math.min(...values);
  const valSpan = maxVal - minVal || 1; // 避免除以零

  // 座標轉換函式
  const xScale = (i) => MARGIN.left + (i / (data.length - 1)) * plotW;
  const yScale = (v) => MARGIN.top  + plotH - ((v - minVal) / valSpan) * plotH;

  /* 4-1. 背景底色（繪圖區） */
  svg.appendChild(svgEl('rect', {
    x: MARGIN.left, y: MARGIN.top,
    width: plotW, height: plotH,
    fill: '#f8f9fa', rx: '4'
  }));

  /* 4-2. 水平格線與 Y 軸標籤（5 條） */
  const gridCount = 4;
  for (let i = 0; i <= gridCount; i++) {
    const val = minVal + (valSpan / gridCount) * i;
    const y   = yScale(val);

    // 格線
    svg.appendChild(svgEl('line', {
      x1: MARGIN.left, y1: y,
      x2: MARGIN.left + plotW, y2: y,
      stroke: '#dde1e7', 'stroke-width': '1',
      'stroke-dasharray': i === 0 ? 'none' : '4 3'
    }));

    // Y 軸標籤
    const label = svgEl('text', {
      x: MARGIN.left - 6, y: y,
      'text-anchor': 'end',
      'dominant-baseline': 'middle',
      fill: '#7f8c8d', 'font-size': '11',
      'font-family': 'sans-serif'
    });
    label.textContent = Math.round(val);
    svg.appendChild(label);
  }

  /* 4-3. X 軸標籤（依資料量自動間隔，最多顯示 12 個） */
  const maxLabels = 12;
  const step = Math.ceil(data.length / maxLabels);
  data.forEach((d, i) => {
    if (i % step !== 0 && i !== data.length - 1) return;
    const x = xScale(i);
    const label = svgEl('text', {
      x, y: MARGIN.top + plotH + 16,
      'text-anchor': 'middle',
      fill: '#7f8c8d', 'font-size': '11',
      'font-family': 'sans-serif'
    });
    label.textContent = d.label;
    svg.appendChild(label);
  });

  /* 4-4. 填充區域（漸層效果） */
  const areaPoints = [
    `${MARGIN.left},${MARGIN.top + plotH}`,
    ...data.map((d, i) => `${xScale(i)},${yScale(d.kwh)}`),
    `${xScale(data.length - 1)},${MARGIN.top + plotH}`
  ].join(' ');

  // 定義漸層
  const defs = svgEl('defs');
  const grad = svgEl('linearGradient', { id: 'areaGrad', x1: '0', y1: '0', x2: '0', y2: '1' });
  const stop1 = svgEl('stop', { offset: '0%',   'stop-color': '#4a90d9', 'stop-opacity': '0.25' });
  const stop2 = svgEl('stop', { offset: '100%', 'stop-color': '#4a90d9', 'stop-opacity': '0.03' });
  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);

  svg.appendChild(svgEl('polygon', {
    points: areaPoints,
    fill: 'url(#areaGrad)'
  }));

  /* 4-5. 折線 */
  const linePoints = data.map((d, i) => `${xScale(i)},${yScale(d.kwh)}`).join(' ');
  svg.appendChild(svgEl('polyline', {
    points: linePoints,
    fill: 'none',
    stroke: '#4a90d9',
    'stroke-width': '2.5',
    'stroke-linejoin': 'round',
    'stroke-linecap': 'round'
  }));

  /* 4-6. 資料點（圓點），只在資料筆數 ≤ 24 時顯示，避免密集遮蓋 */
  if (data.length <= 24) {
    data.forEach((d, i) => {
      svg.appendChild(svgEl('circle', {
        cx: xScale(i), cy: yScale(d.kwh),
        r: '4',
        fill: '#ffffff',
        stroke: '#4a90d9',
        'stroke-width': '2'
      }));
    });
  }

  /* 4-7. X 軸底線 */
  svg.appendChild(svgEl('line', {
    x1: MARGIN.left, y1: MARGIN.top + plotH,
    x2: MARGIN.left + plotW, y2: MARGIN.top + plotH,
    stroke: '#bdc3c7', 'stroke-width': '1.5'
  }));

  /* 4-8. Y 軸左線 */
  svg.appendChild(svgEl('line', {
    x1: MARGIN.left, y1: MARGIN.top,
    x2: MARGIN.left, y2: MARGIN.top + plotH,
    stroke: '#bdc3c7', 'stroke-width': '1.5'
  }));

  /* 4-9. Y 軸單位標示 */
  const unitLabel = svgEl('text', {
    x: MARGIN.left - 40, y: MARGIN.top - 6,
    'text-anchor': 'start',
    fill: '#95a5a6', 'font-size': '10',
    'font-family': 'sans-serif'
  });
  unitLabel.textContent = '(kWh)';
  svg.appendChild(unitLabel);
}

/* ── 5. 設備狀態列表 ──────────────────────────────── */

/** 狀態對應的顯示文字 */
const STATUS_LABEL = {
  normal:  '正常',
  anomaly: '異常',
  offline: '離線'
};

/** 狀態排序權重（數字小的排在前面） */
const STATUS_ORDER = { anomaly: 0, offline: 1, normal: 2 };

/** 渲染設備列表，依 anomaly → offline → normal 排序 */
function renderDeviceList() {
  const list = document.getElementById('device-list');
  if (!list) return;

  // 依狀態優先順序排序（不修改原始資料）
  const sorted = [...DEVICE_DATA].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
  );

  list.innerHTML = sorted.map(device => {
    const kwhDisplay = device.status === 'offline'
      ? '—'
      : `${device.kwh} kWh`;

    return `
      <li class="device-item status-${device.status}">
        <span class="device-name">${device.name}</span>
        <span class="device-kwh">${kwhDisplay}</span>
        <span class="device-status">${STATUS_LABEL[device.status] ?? device.status}</span>
      </li>
    `;
  }).join('');
}

/** 統計並更新異常設備數量徽章 */
function updateAnomalyCount() {
  const badge = document.getElementById('anomaly-count');
  if (!badge) return;

  const count = DEVICE_DATA.filter(d => d.status === 'anomaly').length;
  badge.textContent = `異常設備：${count} 台`;

  if (count === 0) {
    badge.classList.add('all-normal');
    // 在列表下方加入「全部正常」提示
    const list = document.getElementById('device-list');
    if (list) {
      const hint = document.createElement('li');
      hint.className = 'all-normal-hint';
      hint.textContent = '所有設備運作正常';
      list.appendChild(hint);
    }
  } else {
    badge.classList.remove('all-normal');
  }
}

/* ── 6. 切換按鈕事件 ──────────────────────────────── */

function bindChartToggle() {
  const btnHourly = document.getElementById('btn-hourly');
  const btnDaily  = document.getElementById('btn-daily');
  if (!btnHourly || !btnDaily) return;

  btnHourly.addEventListener('click', () => {
    btnHourly.classList.add('active');
    btnDaily.classList.remove('active');
    drawTrendChart('hourly');
  });

  btnDaily.addEventListener('click', () => {
    btnDaily.classList.add('active');
    btnHourly.classList.remove('active');
    drawTrendChart('daily');
  });
}

/* ── 7. 頁面入口 ──────────────────────────────────── */

/** 初始化儀表板，DOMContentLoaded 後執行 */
function initDashboard() {
  renderSummaryCards();
  drawTrendChart('hourly');  // 預設顯示每小時趨勢
  renderDeviceList();
  updateAnomalyCount();
  bindChartToggle();
}

document.addEventListener('DOMContentLoaded', initDashboard);

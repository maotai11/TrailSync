// js/ui/treadmill-ui.js
/**
 * 跑步機換算工具 UI 接線模組 (最終極簡版)
 * 
 * 重構重點：
 * 1. 業務邏輯只處理 SI 單位數值，不涉及任何格式化
 * 2. 所有單位轉換和精度控制封裝在 Custom Element 內部
 * 3. 數據流：收集 SI → 計算 → 渲染 SI
 * 4. 零魔數、零單位判斷、零精度處理
 */

import { analyzeTreadmillConversion, verifyTreadmillConversion, TREADMILL_BOUNDS } from '../modules/treadmill-converter.js';
import { exportTreadmillResult } from './png-generator.js';

// 初始化
document.addEventListener('DOMContentLoaded', initTreadmillUI);

function initTreadmillUI() {
  setupEventListeners();
  setupResetButton();
}

function setupEventListeners() {
  const convertBtn = document.getElementById('convert-btn');
  const unitToggle = document.getElementById('unit-toggle');
  const treadmillTestBtn = document.getElementById('treadmill-test');
  
  convertBtn?.addEventListener('click', handleConversion);
  unitToggle?.addEventListener('click', toggleUnit);
  treadmillTestBtn?.addEventListener('click', runTreadmillTests);
}

function toggleUnit() {
  const currentUnit = document.documentElement.dataset.paceUnit || 'metric';
  document.documentElement.dataset.paceUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
  localStorage.setItem('ux:paceUnit', document.documentElement.dataset.paceUnit);
  updateUnitToggleText();
}

function updateUnitToggleText() {
  const unitToggle = document.getElementById('unit-toggle');
  if (unitToggle) {
    const unit = document.documentElement.dataset.paceUnit || 'metric';
    unitToggle.textContent = unit === 'metric' ? '單位: 公制' : '單位: 英制';
  }
}

function handleConversion() {
  try {
    const options = collectInputs();
    validateInputs(options);
    const result = analyzeTreadmillConversion(options);
    renderResult(result);
    saveToHistory(options, result);
  } catch (error) {
    showError(error.message);
  }
}

function collectInputs() {
  return {
    treadmillPace: getPaceInputValue('treadmill-pace'),
    treadmillGradient: getNumberInputValue('treadmill-gradient'),
    roadPace: getPaceInputValue('road-pace'),
    roadGradient: getNumberInputValue('road-gradient'),
    targetGradient: getNumberInputValue('target-gradient')
  };
}

function validateInputs(options) {
  // 驗證跑步機輸入範圍
  if (options.treadmillPace !== null) {
    validateRange(
      options.treadmillPace, 
      TREADMILL_BOUNDS.treadmillPace[0], 
      TREADMILL_BOUNDS.treadmillPace[1],
      '跑步機配速'
    );
  }
  
  if (options.treadmillGradient !== null) {
    validateRange(
      options.treadmillGradient, 
      TREADMILL_BOUNDS.treadmillGrad[0], 
      TREADMILL_BOUNDS.treadmillGrad[1],
      '跑步機坡度'
    );
  }
  
  // 驗證公路輸入範圍
  if (options.roadPace !== null) {
    validateRange(
      options.roadPace, 
      TREADMILL_BOUNDS.roadPace[0], 
      TREADMILL_BOUNDS.roadPace[1],
      '公路配速'
    );
  }
  
  if (options.roadGradient !== null) {
    validateRange(
      options.roadGradient, 
      TREADMILL_BOUNDS.roadGrad[0], 
      TREADMILL_BOUNDS.roadGrad[1],
      '公路坡度'
    );
  }
  
  if (options.targetGradient !== null) {
    validateRange(
      options.targetGradient, 
      TREADMILL_BOUNDS.treadmillGrad[0], 
      TREADMILL_BOUNDS.treadmillGrad[1],
      '目標跑步機坡度'
    );
  }
}

function validateRange(value, min, max, name) {
  if (value < min || value > max) {
    throw new Error(`${name}必須在 ${min}–${max} 之間`);
  }
}

function renderResult(result) {
  const resultEl = document.getElementById('conversion-result');
  resultEl.innerHTML = `
    <div class="result-card ${result.assessment.level}">
      <div class="result-header">
        <h4>換算診斷結果</h4>
        <span class="assessment-badge ${result.assessment.level}">
          ${result.assessment.description}
        </span>
      </div>
      ${renderConversionSections(result)}
      ${renderPaceDifference(result)}
      ${renderExportButton()}
    </div>
  `;
}

function renderConversionSections(result) {
  // 格式化浮點數，避免 DOM 中出現 5.300000000000001 這種垃圾
  const fmt = v => Number(v.toFixed(3));
  
  let html = '';
  
  // 跑步機→公路結果
  if (result.roadResult) {
    html += `
      <div class="result-section">
        <h5>跑步機 → 公路換算</h5>
        <div class="result-grid">
          <div>跑步機: <formatted-pace value="${fmt(result.roadResult.treadmillPace)}"></formatted-pace> @ <formatted-gradient value="${fmt(result.roadResult.treadmillGradient)}"></formatted-gradient></div>
          <div>公路: <formatted-pace value="${fmt(result.roadResult.roadPace)}"></formatted-pace> @ <formatted-gradient value="${fmt(result.roadResult.roadGradient)}"></formatted-gradient></div>
        </div>
      </div>
    `;
  }

  // 公路→跑步機結果
  if (result.treadmillResult) {
    html += `
      <div class="result-section">
        <h5>公路 → 跑步機換算</h5>
        <div class="result-grid">
          <div>公路: <formatted-pace value="${fmt(result.treadmillResult.roadPace)}"></formatted-pace> @ <formatted-gradient value="${fmt(result.treadmillResult.roadGradient)}"></formatted-gradient></div>
          <div>跑步機: <formatted-pace value="${fmt(result.treadmillResult.treadmillPace)}"></formatted-pace> @ <formatted-gradient value="${fmt(result.treadmillResult.treadmillGradient)}"></formatted-gradient></div>
        </div>
      </div>
    `;
  }

  // 坡度換算結果
  if (result.gradientConversion) {
    html += `
      <div class="result-section">
        <h5>坡度換算</h5>
        <div class="result-grid">
          <div>公路→跑步機: ${result.gradientConversion.roadToTreadmill !== null ? 
            `<formatted-gradient value="${fmt(result.gradientConversion.roadToTreadmill)}"></formatted-gradient>` : 'N/A'}</div>
          <div>跑步機→公路: ${result.gradientConversion.treadmillToRoad !== null ? 
            `<formatted-gradient value="${fmt(result.gradientConversion.treadmillToRoad)}"></formatted-gradient>` : 'N/A'}</div>
        </div>
      </div>
    `;
  }
  
  return html;
}

function renderPaceDifference(result) {
  if (result.paceDiffPercent !== null) {
    return `
      <div class="result-section">
        <h5>配速差異</h5>
        <div class="diff-percentage">
          <span class="diff-value">${result.paceDiffPercent}%</span>
          <div class="diff-bar">
            <div class="diff-fill" style="width: ${Math.min(Math.abs(result.paceDiffPercent), 25) * 4}%"></div>
          </div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="result-section">
      <h5>配速差異</h5>
      <div class="diff-percentage">
        <span class="diff-value">—</span>
      </div>
    </div>
  `;
}

function renderExportButton() {
  return `
    <div class="result-actions">
      <button id="export-treadmill-png" class="btn btn-secondary">匯出為 PNG</button>
    </div>
  `;
}

function showError(msg) {
  const resultEl = document.getElementById('conversion-result');
  resultEl.innerHTML = `
    <div class="alert" style="border-left:4px solid #d33;padding:8px">
      <strong>錯誤：</strong>${msg}
    </div>
  `;
}

function saveToHistory(options, result) {
  window.dispatchEvent(new CustomEvent('history:add', {
    detail: {
      feature: '跑步機換算',
      timestamp: new Date(),
      input: {
        treadmillPace: options.treadmillPace,
        treadmillGradient: options.treadmillGradient,
        roadPace: options.roadPace,
        roadGradient: options.roadGradient,
        targetGradient: options.targetGradient
      },
      result: result
    }
  }));
}

function runTreadmillTests() {
  try {
    const result = verifyTreadmillConversion();
    if (result.overallPass) {
      alert(`跑步機模組測試通過！所有 ${Object.keys(result).length - 1} 項測試成功`);
    } else {
      const failedTests = Object.entries(result)
        .filter(([key, value]) => key !== 'overallPass' && value.pass === false)
        .map(([key]) => key)
        .join(', ');
      alert(`跑步機模組測試失敗！${failedTests} 測試未通過`);
    }
  } catch (error) {
    alert(`測試執行失敗: ${error.message}`);
  }
}

function setupResetButton() {
  const resetBtn = document.getElementById('reset-btn');
  resetBtn?.addEventListener('click', () => {
    // SI 真理值 - 小數位與單位轉換由 Custom Element 自行處理
    document.getElementById('treadmill-pace').value       = 5.0;   // SI 單位 (min/km)
    document.getElementById('treadmill-gradient').value   = 0;     // SI 單位 (%)
    document.getElementById('road-pace').value            = null;  // 無輸入
    document.getElementById('road-gradient').value        = null;  // 無輸入
    document.getElementById('target-gradient').value      = 0;     // SI 單位 (%)
    document.getElementById('conversion-result').innerHTML = '';
  });
}

// =============== 輔助函數 ===============

function getPaceInputValue(id) {
  const input = document.getElementById(id);
  return input ? input.value : null;
}

function getNumberInputValue(id) {
  const input = document.getElementById(id);
  if (!input) return null;
  
  const value = parseFloat(input.value);
  return isNaN(value) ? null : value;
}
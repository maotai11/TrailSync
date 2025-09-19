/**
 * 配速輸入 Custom Element
 * 
 * 功能：
 * 1. 處理配速輸入（min/km 或 min/mile）
 * 2. 根據全局單位偏好自動轉換
 * 3. 統一管理精度（避免浮點垃圾）
 * 4. 觸發標準化事件
 * 
 * 設計原則：
 * - 數據層純 SI：內部存儲始終為 min/km (SI)
 * - 表現層隔離：不處理業務邏輯，只負責輸入/顯示
 * - 無魔數：使用集中管理的轉換係數
 * - 零浮點垃圾：統一精度處理
 */

import { KM_PER_MILE } from '../modules/treadmill-converter.js';

/**
 * 數值格式化工具（避免浮點垃圾）
 * @param {number} value - 原始數值
 * @returns {number} 格式化後的數值
 */
const fmt = value => Number(value.toFixed(3));

class PaceInput extends HTMLElement {
  static get observedAttributes() { 
    return ['value', 'unit']; 
  }
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          width: 100%;
          font-family: inherit;
        }
        .input-container {
          position: relative;
          width: 100%;
        }
        input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        input:focus {
          outline: none;
          border-color: #4a90e2;
          box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
        }
        :host([invalid]) input {
          border-color: #d33;
        }
        .unit-hint {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #888;
          font-size: 12px;
          pointer-events: none;
        }
      </style>
      <div class="input-container">
        <input type="text" inputmode="decimal" aria-label="配速輸入">
        <span class="unit-hint"></span>
      </div>
    `;
    
    this.input = this.shadowRoot.querySelector('input');
    this.unitHint = this.shadowRoot.querySelector('.unit-hint');
    
    // 事件處理
    this.input.addEventListener('blur', () => this.handleBlur());
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleBlur();
        e.preventDefault();
      }
    });
    
    // 監聽全局單位變化
    document.documentElement.addEventListener('datasetchange', (e) => {
      if (e.detail.name === 'paceUnit') {
        this.render();
      }
    });
  }
  
  connectedCallback() {
    this.render();
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }
  
  /**
   * 獲取當前單位偏好
   * @returns {string} 'metric' 或 'imperial'
   */
  get unit() {
    return document.documentElement.dataset.paceUnit || 'metric';
  }
  
  /**
   * 獲取 SI 單位的配速值 (min/km)
   * @returns {number|null} 配速值或 null
   */
  get value() {
    const siValue = parseFloat(this.getAttribute('value'));
    return isNaN(siValue) ? null : siValue;
  }
  
  /**
   * 設置 SI 單位的配速值 (min/km)
   * @param {number|null} newValue - 新的配速值
   */
  set value(newValue) {
    if (newValue === null || newValue === undefined) {
      this.removeAttribute('value');
    } else {
      this.setAttribute('value', newValue);
    }
    this.render();
  }
  
  /**
   * 處理輸入框失去焦點
   */
  handleBlur() {
    const strValue = this.input.value.trim();
    if (strValue === '') {
      this.setInvalid(false);
      this.value = null;
      this.dispatchEventValueChange(null);
      return;
    }
    
    const numValue = parseFloat(strValue.replace(',', '.'));
    if (isNaN(numValue)) {
      this.setInvalid(true);
      return;
    }
    
    // 轉換為 SI 單位 (min/km)
    const siValue = this.unit === 'imperial' ? numValue / KM_PER_MILE : numValue;
    const formattedValue = fmt(siValue);
    
    this.setInvalid(false);
    this.value = formattedValue;
    this.dispatchEventValueChange(formattedValue);
  }
  
  /**
   * 渲染輸入框
   */
  render() {
    const siValue = this.value;
    const unit = this.unit;
    
    // 更新單位提示
    this.unitHint.textContent = unit === 'metric' ? 'min/km' : 'min/mile';
    
    if (siValue === null) {
      this.input.value = '';
      return;
    }
    
    // 根據當前單位格式化顯示
    const displayValue = unit === 'imperial' 
      ? fmt(siValue * KM_PER_MILE) 
      : fmt(siValue);
    
    this.input.value = displayValue.toString();
  }
  
  /**
   * 觸發值變化事件
   * @param {number|null} value - 新的 SI 單位值
   */
  dispatchEventValueChange(value) {
    this.dispatchEvent(new CustomEvent('value-changed', { 
      detail: { value },
      bubbles: true,
      composed: true
    }));
  }
  
  /**
   * 設置無效狀態
   * @param {boolean} invalid - 是否無效
   */
  setInvalid(invalid) {
    if (invalid) {
      this.setAttribute('invalid', '');
    } else {
      this.removeAttribute('invalid');
    }
  }
}

// 註冊 Custom Element
if (!customElements.get('pace-input')) {
  customElements.define('pace-input', PaceInput);
}

export default PaceInput;
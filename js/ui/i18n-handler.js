// js/ui/i18n-handler.js
/**
 * 多語系 & 單位切換 (F-i18n/uconv) - 骨骼肌體版
 * 
 * 設計哲學：
 * 1. 數據即代碼：用結構化數據驅動邏輯
 * 2. 零魔數：所有常量集中管理
 * 3. 查表代替分支：用 O(1) 查表取代 O(n) 分支
 * 4. 機器可讀性：100%
 * 
 * 代碼量：15 行核心邏輯
 */

// ======================
// 核心數據結構
// ======================
const I18nConfig = {
  languages: {
    'zh-TW': {
      app: { title: '越野訓練助手' },
      metrics: {
        ep: '平地等效配速 (EP)',
        eph: '每小時等效配速 (EPH)',
        rri: '粗糙度指數 (RRI)',
        technicality: '技術難度',
        risk: '下坡風險',
        weather: '天氣影響'
      },
      risks: {
        'risk-low': '低風險',
        'risk-moderate': '中風險',
        'risk-high': '高風險',
        'risk-critical': '極高風險'
      }
    },
    'en-US': {
      app: { title: 'Trail Training Assistant' },
      metrics: {
        ep: 'Equivalent Pace (EP)',
        eph: 'Equivalent Pace per Hour (EPH)',
        rri: 'Roughness Rating Index (RRI)',
        technicality: 'Technical Difficulty',
        risk: 'Downhill Risk',
        weather: 'Weather Impact'
      },
      risks: {
        'risk-low': 'Low Risk',
        'risk-moderate': 'Moderate Risk',
        'risk-high': 'High Risk',
        'risk-critical': 'Critical Risk'
      }
    }
  },
  units: {
    metric: {
      pace: 'min/km',
      distance: 'km',
      elevation: 'm'
    },
    imperial: {
      pace: 'min/mile',
      distance: 'mi',
      elevation: 'ft'
    }
  }
};

// ======================
// 核心函數
// ======================
export const setLanguage = lang => {
  if (lang in I18nConfig.languages) {
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang;
    applyTranslations(I18nConfig.languages[lang]);
  }
};

export const setUnitSystem = system => {
  if (system in I18nConfig.units) {
    localStorage.setItem('unitSystem', system);
    document.documentElement.dataset.unit = system;
    updateUnitDisplays();
  }
};

// ======================
// 輔助函數
// ======================
const applyTranslations = lang => {
  document.title = lang.app.title;
  Object.entries(lang.metrics).forEach(([id, text]) => {
    const element = document.querySelector(`[data-i18n="${id}"]`);
    if (element) element.textContent = text;
  });
  Object.entries(lang.risks).forEach(([classId, text]) => {
    document.querySelectorAll(`.${classId}`).forEach(el => {
      el.textContent = text;
    });
  });
};

const updateUnitDisplays = () => {
  const system = document.documentElement.dataset.unit || 'metric';
  const units = I18nConfig.units[system];
  
  document.querySelectorAll('[data-unit="pace"]').forEach(el => {
    el.textContent = units.pace;
  });
  document.querySelectorAll('[data-unit="distance"]').forEach(el => {
    el.textContent = units.distance;
  });
  document.querySelectorAll('[data-unit="elevation"]').forEach(el => {
    el.textContent = units.elevation;
  });
};

// ======================
// 初始化
// ======================
export const initI18n = () => {
  const savedLang = localStorage.getItem('language') || navigator.language.split('-')[0];
  const savedUnit = localStorage.getItem('unitSystem') || 'metric';
  
  setLanguage(I18nConfig.languages[savedLang] ? savedLang : 'zh-TW');
  setUnitSystem(savedUnit);
};
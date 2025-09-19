// i18n/units.js
/**
 * 單位轉換邏輯 (km/mi, m/ft)
 * 
 * 功能：
 * 1. 提供公制與英制單位轉換
 * 2. 管理單位偏好
 * 3. 格式化數值顯示
 * 
 * 設計原則：
 * - 數據層純 SI：內部存儲始終使用公制單位
 * - 表現層隔離：不處理業務邏輯，只負責單位轉換
 * - 無魔數：使用集中管理的轉換係數
 * - 零浮點垃圾：統一精度處理
 */

// 轉換係數
export const KM_PER_MILE = 1.609344;
export const M_PER_FOOT = 0.3048;
export const M_PER_METER = 1;

// 精度設置
const DISTANCE_PRECISION = 1;   // 距離精度 (km/mi)
const ELEVATION_PRECISION = 0;  // 海拔精度 (m/ft)
const PACE_PRECISION = 2;       // 配速精度

/**
 * 格式化浮點數
 * @param {number} value - 原始數值
 * @param {number} precision - 精度
 * @returns {number} 格式化後的數值
 */
const fmt = (value, precision) => Number(value.toFixed(precision));

/**
 * 轉換公里為英里
 * @param {number} km - 公里
 * @returns {number} 英里
 */
export function kmToMile(km) {
  return fmt(km / KM_PER_MILE, DISTANCE_PRECISION);
}

/**
 * 轉換英里為公里
 * @param {number} mile - 英里
 * @returns {number} 公里
 */
export function mileToKm(mile) {
  return fmt(mile * KM_PER_MILE, DISTANCE_PRECISION);
}

/**
 * 轉換公尺為英尺
 * @param {number} m - 公尺
 * @returns {number} 英尺
 */
export function mToFt(m) {
  return fmt(m / M_PER_FOOT, ELEVATION_PRECISION);
}

/**
 * 轉換英尺為公尺
 * @param {number} ft - 英尺
 * @returns {number} 公尺
 */
export function ftToM(ft) {
  return fmt(ft * M_PER_FOOT, ELEVATION_PRECISION);
}

/**
 * 格式化距離顯示
 * @param {number} value - 距離值 (km)
 * @param {string} unit - 單位系統 ('metric' 或 'imperial')
 * @returns {string} 格式化後的距離字符串
 */
export function formatDistance(value, unit = 'metric') {
  if (value === null || value === undefined) return '—';
  
  if (unit === 'metric') {
    return `${fmt(value, DISTANCE_PRECISION)} km`;
  } else {
    return `${kmToMile(value)} mi`;
  }
}

/**
 * 格式化海拔顯示
 * @param {number} value - 海拔值 (m)
 * @param {string} unit - 單位系統 ('metric' 或 'imperial')
 * @returns {string} 格式化後的海拔字符串
 */
export function formatElevation(value, unit = 'metric') {
  if (value === null || value === undefined) return '—';
  if (unit === 'metric') {
    return `${fmt(value, ELEVATION_PRECISION)} m`;
  } else {
    return `${mToFt(value)} ft`;
  }
}

/**
 * 格式化配速顯示
 * @param {number} value - 配速值 (min/km)
 * @param {string} unit - 單位系統 ('metric' 或 'imperial')
 * @returns {string} 格式化後的配速字符串
 */
export function formatPace(value, unit = 'metric') {
  if (value === null || value === undefined) return '—';
  if (unit === 'metric') {
    return `${fmt(value, PACE_PRECISION)} min/km`;
  } else {
    // min/km → min/mile
    const paceMile = value * KM_PER_MILE;
    return `${fmt(paceMile, PACE_PRECISION)} min/mile`;
  }
}

/**
 * 格式化坡度顯示
 * @param {number} value - 坡度值 (%)
 * @returns {string} 格式化後的坡度字符串
 */
export function formatGradient(value) {
  if (value === null || value === undefined) return 'N/A';
  return `${fmt(value, 1)}%`;
}

/**
 * 格式化粗糙度指數 (RRI)
 * @param {number} value - RRI 值
 * @returns {string} 格式化後的 RRI 字符串
 */
export function formatRRI(value) {
  if (value === null || value === undefined) return '—';
  return fmt(value, 2);
}

/**
 * 格式化每小時等效配速 (EPH)
 * @param {number} value - EPH 值
 * @returns {string} 格式化後的 EPH 字符串
 */
export function formatEPH(value) {
  if (value === null || value === undefined) return '—';
  return fmt(value, 1);
}

/**
 * 根據當前單位偏好格式化顯示
 * @param {string} type - 格式化類型 ('distance', 'elevation', 'pace', etc.)
 * @param {number} value - 值
 * @returns {string} 格式化後的字符串
 */
export function format(type, value) {
  const unit = document.documentElement.dataset.unit || 'metric';
  
  switch (type) {
    case 'distance':
      return formatDistance(value, unit);
    case 'elevation':
      return formatElevation(value, unit);
    case 'pace':
      return formatPace(value, unit);
    case 'gradient':
      return formatGradient(value);
    case 'rri':
      return formatRRI(value);
    case 'eph':
      return formatEPH(value);
    default:
      return value;
  }
}

/**
 * 獲取當前單位系統的單位標籤
 * @param {string} type - 類型 ('distance', 'elevation', 'pace')
 * @returns {string} 單位標籤
 */
export function getUnitLabel(type) {
  const unit = document.documentElement.dataset.unit || 'metric';
  
  switch (type) {
    case 'distance':
      return unit === 'metric' ? 'km' : 'mi';
    case 'elevation':
      return unit === 'metric' ? 'm' : 'ft';
    case 'pace':
      return unit === 'metric' ? 'min/km' : 'min/mile';
    default:
      return '';
  }
}

/**
 * 獲取當前單位系統的完整單位描述
 * @param {string} type - 類型 ('distance', 'elevation', 'pace')
 * @returns {string} 完整單位描述
 */
export function getUnitDescription(type) {
  const unit = document.documentElement.dataset.unit || 'metric';
  
  switch (type) {
    case 'distance':
      return unit === 'metric' ? '公里' : '英里';
    case 'elevation':
      return unit === 'metric' ? '公尺' : '英尺';
    case 'pace':
      return unit === 'metric' ? '每公里分鐘數' : '每英里分鐘數';
    default:
      return '';
  }
}

/**
 * 獲取當前單位系統的範圍提示
 * @param {string} type - 類型 ('treadmillPace', 'roadGrad', etc.)
 * @returns {string} 範圍提示
 */
export function getRangeHint(type) {
  const unit = document.documentElement.dataset.unit || 'metric';
  
  // 這裡應該從 treadmill-converter.js 中獲取 TREADMILL_BOUNDS
  // 但由於不能直接導入，我們使用一個簡化的實現
  const bounds = {
    treadmillPace: [0.5, 25],
    roadGrad: [-30, 30],
    treadmillGrad: [0, 15]
  };
  
  const [min, max] = bounds[type] || [0, 100];
  
  switch (type) {
    case 'treadmillPace':
      if (unit === 'metric') {
        return `範圍：配速 ${min}-${max} min/km`;
      } else {
        return `Range: pace ${kmToMile(min)}-${kmToMile(max)} min/mile`;
      }
    case 'roadGrad':
    case 'treadmillGrad':
      return `範圍：坡度 ${min}-${max}%`;
    default:
      return '';
  }
}

// 導出單位轉換工具
export const unitFormatter = {
  distance: formatDistance,
  elevation: formatElevation,
  pace: formatPace,
  gradient: formatGradient,
  rri: formatRRI,
  eph: formatEPH
};
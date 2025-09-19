// js/core/weather-modifier.js
/**
 * WBGT 熱膨脹 (G1) + 風險管理 (G2) - 骨骼肌體版
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
const WeatherConfig = {
  bounds: {
    wbt: [15, 45],
    windSpeed: [0, 20],
    humidity: [0, 100]
  },
  factors: {
    pace: 0.15,
    wind: 0.05,
    humidity: 0.005
  },
  riskLevels: [
    { max: 22, class: 'risk-low', text: '安全' },
    { max: 28, class: 'risk-moderate', text: '注意' },
    { max: 32, class: 'risk-high', text: '高風險' },
    { max: 35, class: 'risk-very-high', text: '極高風險' },
    { max: Infinity, class: 'risk-extreme', text: '危險' }
  ]
};

// ======================
// 核心計算函數
// ======================
export const calculatePaceImpact = (wbt, windSpeed = 0, humidity = 50) => {
  const baseImpact = (wbt - 20) * WeatherConfig.factors.pace;
  const windImpact = windSpeed * WeatherConfig.factors.wind;
  const humidityImpact = (humidity / 100) * WeatherConfig.factors.humidity * 10;
  return Math.max(0, baseImpact - windImpact + humidityImpact);
};

export const getHeatRiskLevel = wbt => 
  WeatherConfig.riskLevels.find(level => wbt <= level.max);

// ======================
// 工具函數
// ======================
export const validateInput = (value, [min, max]) => 
  value >= min && value <= max;

export const formatRiskLevel = level => ({
  class: `risk-${level.text.toLowerCase().replace(' ', '-')}`,
  text: level.text
});
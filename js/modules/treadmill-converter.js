// js/modules/treadmill-converter.js
/**
 * 跑步機換算模組 (C11) - 骨骼肌體版
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
const TreadmillConfig = {
  bounds: {
    pace: [0.5, 25],
    gradient: [0, 15],
    roadGradient: [-30, 30]
  },
  factors: {
    gradient: 0.12
  },
  thresholds: {
    diff: 5
  }
};

// ======================
// 核心計算函數
// ======================
export const convertTreadmillToRoad = (treadmillPace, treadmillGradient) => 
  treadmillPace * (1 - treadmillGradient * TreadmillConfig.factors.gradient);

export const convertRoadToTreadmill = (roadPace, targetGradient) => 
  roadPace / (1 - targetGradient * TreadmillConfig.factors.gradient);

export const calculateGradientConversion = (treadmillPace, roadPace) => 
  (1 - roadPace / treadmillPace) / TreadmillConfig.factors.gradient;

// ======================
// 評估函數
// ======================
export const assessConversion = paceDiffPercent => {
  const levels = [
    { max: TreadmillConfig.thresholds.diff, class: 'normal', text: '正常' },
    { max: TreadmillConfig.thresholds.diff * 2, class: 'warning', text: '警告' },
    { max: Infinity, class: 'critical', text: '危險' }
  ];
  return levels.find(level => Math.abs(paceDiffPercent) <= level.max);
};

// ======================
// 工具函數
// ======================
export const validateInput = (value, [min, max]) => 
  value >= min && value <= max;

export const calculatePaceDifference = (treadmillPace, roadPace) => 
  ((treadmillPace - roadPace) / roadPace) * 100;
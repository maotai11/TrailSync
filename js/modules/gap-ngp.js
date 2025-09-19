// js/modules/gap-ngp.js
/**
 * GAP/NGP 對照模組 (C3) - 骨骼肌體版
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
const GapConfig = {
  bounds: {
    pace: [0.5, 25],
    gradient: [-30, 30]
  },
  factors: {
    gap: 0.07,
    ngp: 0.05,
    tech: 0.03
  }
};

// ======================
// 核心計算函數
// ======================
export const calculateGAP = (pace, gradient, tech = 0) => {
  const base = pace * (1 + gradient * GapConfig.factors.gap);
  return base * (1 + tech * GapConfig.factors.tech);
};

export const calculateNGP = (pace, gradient, tech = 0) => {
  const base = pace * (1 + gradient * GapConfig.factors.ngp);
  return base * (1 + tech * GapConfig.factors.tech);
};

export const gapToNpg = (gap, gradient) => 
  gap / (1 + gradient * GapConfig.factors.gap) * 
  (1 + gradient * GapConfig.factors.ngp);

export const ngpToGap = (ngp, gradient) => 
  ngp / (1 + gradient * GapConfig.factors.ngp) * 
  (1 + gradient * GapConfig.factors.gap);

// ======================
// 工具函數
// ======================
export const validateInput = (value, [min, max]) => 
  value >= min && value <= max;

export const formatResult = {
  gap: gap => `${gap.toFixed(2)} min/km`,
  ngp: ngp => `${ngp.toFixed(2)} min/km`,
  diff: (gap, ngp) => {
    const diff = gap - ngp;
    return {
      value: diff.toFixed(2),
      percent: ((diff / ngp) * 100).toFixed(1)
    };
  }
};
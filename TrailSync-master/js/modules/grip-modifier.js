// js/modules/grip-modifier.js
/**
 * 裝備影響檢核 (B4 濕滑修正) - 骨骼肌體版
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
const GripConfig = {
  conditions: {
    surface: {
      'dry_pavement': { score: 9, text: '乾燥柏油路' },
      'wet_pavement': { score: 6, text: '潮濕柏油路' },
      'dry_trail': { score: 8, text: '乾燥土徑' },
      'wet_trail': { score: 4, text: '潮濕土徑' },
      'muddy': { score: 2, text: '泥濘路面' },
      'rocky': { score: 7, text: '岩石路面' },
      'loose_gravel': { score: 3, text: '鬆散礫石' },
      'snow': { score: 1, text: '雪地' },
      'ice': { score: 0, text: '冰面' }
    },
    shoe: {
      'road_shoe': { grip: 3, text: '公路跑鞋' },
      'trail_shoe_light': { grip: 6, text: '輕量越野跑鞋' },
      'trail_shoe_heavy': { grip: 8, text: '重型越野跑鞋' },
      'spikes': { grip: 10, text: '釘鞋' }
    },
    weather: {
      'dry': { impact: 0, text: '乾燥' },
      'light_rain': { impact: 3, text: '小雨' },
      'heavy_rain': { impact: 7, text: '大雨' },
      'fog': { impact: 2, text: '霧' },
      'snow': { impact: 5, text: '雪' },
      'ice': { impact: 9, text: '凍雨/冰' }
    }
  },
  factors: {
    surface: 0.4,
    shoe: 0.3,
    weather: 0.2,
    tech: 0.1
  },
  riskLevels: [
    { max: 3, class: 'risk-low', text: '安全' },
    { max: 6, class: 'risk-moderate', text: '注意' },
    { max: 8, class: 'risk-high', text: '高風險' },
    { max: Infinity, class: 'risk-critical', text: '極高風險' }
  ]
};

// ======================
// 核心計算函數
// ======================
export const calculateGripScore = (surface, shoe, weather, technicality = 0) => {
  const surfaceScore = GripConfig.conditions.surface[surface].score;
  const shoeGrip = GripConfig.conditions.shoe[shoe].grip;
  const weatherImpact = GripConfig.conditions.weather[weather].impact;
  
  return (surfaceScore * GripConfig.factors.surface) + 
         (shoeGrip * GripConfig.factors.shoe) + 
         ((10 - weatherImpact) * GripConfig.factors.weather) + 
         ((10 - (technicality * 10)) * GripConfig.factors.tech);
};

export const getGripRiskLevel = score => 
  GripConfig.riskLevels.find(level => (10 - score) <= level.max);

// ======================
// 工具函數
// ======================
export const validateInput = (value, options) => 
  value in options;

export const getConditionText = (type, value) => 
  GripConfig.conditions[type][value].text;
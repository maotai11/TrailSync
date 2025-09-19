
// 風險計算引擎

/**
 * 計算路線的粗糙度指數 (Roughness and RIskiness Index)
 * @param {number} distance - 距離 (km)
 * @param {number} elevation - 爬升 (m)
 * @returns {number} RRI 值
 */
export function calculateRRI(distance, elevation) {
    if (distance <= 0) return 0;
    return (elevation / distance) * 0.15;
}

/**
 * 根據分數獲取風險等級
 * @param {number} score - 風險分數
 * @returns {{class: string, text: string}} 風險等級的樣式和文字
 */
export function getRiskLevel(score) {
    if (score <= 20) return { class: 'risk-low', text: '低風險' };
    if (score <= 40) return { class: 'risk-moderate', text: '中風險' };
    if (score <= 70) return { class: 'risk-high', text: '高風險' };
    return { class: 'risk-critical', text: '極高風險' };
}

/**
 * 計算技術難度
 * @param {string} routeType - 路線類型
 * @returns {string} 技術難度文字
 */
export function getTechnicality(routeType) {
    const technicalityMap = {
        road: '非常低',
        fire_trail: '低',
        technical: '中等',
        alpine: '高'
    };
    return technicalityMap[routeType] || '未知';
}

/**
 * 計算下坡風險分數
 * @param {number} downhillDistance - 總下坡距離 (km)
 * @param {number} totalDescent - 總下降 (m)
 * @returns {number} 風險分數
 */
export function calculateDownhillRisk(downhillDistance, totalDescent) {
    if (downhillDistance <= 0) return 0;
    const descentPerKm = totalDescent / downhillDistance;
    return (descentPerKm * 0.6) + (downhillDistance * 0.3);
}

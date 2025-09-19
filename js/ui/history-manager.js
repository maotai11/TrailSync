
// 歷史紀錄管理器 (使用 localStorage)

const TRAINING_HISTORY_KEY = 'trailSyncTrainingHistory';

/**
 * 從 localStorage 獲取訓練歷史
 * @returns {Array} 歷史紀錄陣列
 */
export function getTrainingHistory() {
    try {
        const history = localStorage.getItem(TRAINING_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
    } catch (e) {
        console.error("Error reading training history from localStorage", e);
        return [];
    }
}

/**
 * 保存一筆訓練紀錄到 localStorage
 * @param {object} entry - 要保存的紀錄物件
 */
export function saveTrainingToHistory(entry) {
    const history = getTrainingHistory();
    history.push(entry);
    try {
        localStorage.setItem(TRAINING_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error("Error saving training history to localStorage", e);
    }
}

/**
 * 清除 localStorage 中的訓練歷史
 */
export function clearTrainingHistory() {
    try {
        localStorage.removeItem(TRAINING_HISTORY_KEY);
    } catch (e) {
        console.error("Error clearing training history from localStorage", e);
    }
}

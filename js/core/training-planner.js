
import { minutesPerKmToHoursPerKm, paceToMinutesPerKm } from './calculator.js';

/**
 * 使用 Riegel 公式預測不同距離的完賽時間
 * T2 = T1 * (D2 / D1)^1.06
 * @param {number} t1 - 已知時間 (小時)
 * @param {number} d1 - 已知距離 (公里)
 * @param {number} d2 - 目標距離 (公里)
 * @returns {number} 預測的目標距離完賽時間 (小時)
 */
export function riegelPrediction(t1, d1, d2) {
    if (t1 <= 0 || d1 <= 0 || d2 <= 0) return 0;
    return t1 * Math.pow(d2 / d1, 1.06);
}

/**
 * 根據基準配速 (小時/公里) 計算各強度配速
 * @param {number} basePaceInHoursPerKm - 10K 競賽配速 (小時/公里)
 * @returns {object} 包含 I, T, M, E 配速的物件 (小時/公里)
 */
export function getPaceZones(basePaceInHoursPerKm) {
    if (basePaceInHoursPerKm <= 0) {
        return { I: 0, T: 0, M: 0, E: 0 };
    }

    // 根據 Daniels' Running Formula 的通用規則估算
    // T-Pace (Threshold): 約比 10K 配速慢 15-20 秒/公里
    const tPace = basePaceInHoursPerKm + minutesPerKmToHoursPerKm(0, 18);

    // I-Pace (Interval): 約等於 3K-5K 配速。我們用 Riegel 從 10K 推算 3K 配速
    const time10k = basePaceInHoursPerKm * 10;
    const time3k = riegelPrediction(time10k, 10, 3);
    const iPace = time3k / 3;

    // M-Pace (Marathon): 全馬配速。用 Riegel 從 10K 推算 42.195K 配速
    const time42k = riegelPrediction(time10k, 10, 42.195);
    const mPace = time42k / 42.195;

    // E-Pace (Easy/LSD): 約比 M-Pace 慢 60-90 秒/公里
    const ePace = mPace + minutesPerKmToHoursPerKm(1, 15);

    return {
        I: iPace,
        T: tPace,
        M: mPace,
        E: ePace,
    };
}

/**
 * 產生完整的訓練課表建議
 * @param {object} options - 使用者輸入的選項
 * @returns {object} 包含熱身、主課表、緩和的完整課表物件
 */
export function generateWorkout(options) {
    const {
        baseRace, // { distance, timeInHours }
        mainWorkout, // { type, distance, reps, targetPace }
        warmup, // { type, value }
    } = options;

    // 1. 計算基準配速和各區間配速
    const basePace = baseRace.timeInHours / baseRace.distance;
    const paceZones = getPaceZones(basePace);

    // 2. 決定主課表配速
    let mainPaceInHoursPerKm;
    switch (mainWorkout.targetPace) {
        case 'I pace':
            mainPaceInHoursPerKm = paceZones.I;
            break;
        case 'T pace':
            mainPaceInHoursPerKm = paceZones.T;
            break;
        case 'M pace':
            mainPaceInHoursPerKm = paceZones.M;
            break;
        default: // LSD 或其他
            mainPaceInHoursPerKm = paceZones.E;
    }
    
    const mainPaceFormatted = paceToMinutesPerKm(mainPaceInHoursPerKm);
    const finalMainWorkout = { ...mainWorkout, pace: mainPaceFormatted };

    // 3. 計算熱身
    const warmupPaceInHoursPerKm = mainPaceInHoursPerKm + minutesPerKmToHoursPerKm(1, 45); // 主配速 +1:30-2:00
    const warmupPaceFormatted = `${paceToMinutesPerKm(warmupPaceInHoursPerKm + minutesPerKmToHoursPerKm(0, 10))} - ${paceToMinutesPerKm(warmupPaceInHoursPerKm - minutesPerKmToHoursPerKm(0, 10))}`;
    
    let warmupDistance, warmupTime;
    if (warmup.type === 'distance') {
        warmupDistance = warmup.value;
        warmupTime = warmup.value * warmupPaceInHoursPerKm * 60; // 分鐘
    } else { // time
        warmupTime = warmup.value;
        warmupDistance = warmup.value / 60 / warmupPaceInHoursPerKm;
    }

    const finalWarmup = {
        text: `${warmupTime.toFixed(0)} 分鐘 (約 ${warmupDistance.toFixed(1)} 公里)`,
        pace: warmupPaceFormatted,
        zone: 'Zone 1-2',
        strides: mainWorkout.targetPace === 'I pace' ? '4-6x100m strides' : null
    };

    // 4. 計算緩和
    const cooldownTime = warmupTime * 0.7; // 熱身時間的 0.6-0.8
    const cooldownPaceInHoursPerKm = warmupPaceInHoursPerKm + minutesPerKmToHoursPerKm(0, 10); // 比熱身慢
    const cooldownDistance = cooldownTime / 60 / cooldownPaceInHoursPerKm;

    const finalCooldown = {
        text: `${cooldownTime.toFixed(0)} 分鐘 (約 ${cooldownDistance.toFixed(1)} 公里)`,
        pace: paceToMinutesPerKm(cooldownPaceInHoursPerKm)
    };

    return {
        warmup: finalWarmup,
        main: finalMainWorkout,
        cooldown: finalCooldown,
        debug: { paceZones }
    };
}

/**
 * Calculates the percentage of actual pace relative to a threshold pace.
 * @param {number} actualPace - The actual pace in minutes/km.
 * @param {number} thresholdPace - The threshold pace in minutes/km.
 * @returns {number} The percentage (e.g., 105 for 105%).
 */
export function calculateThresholdPercentage(actualPace, thresholdPace) {
    if (thresholdPace <= 0) return 0; // Avoid division by zero
    return (thresholdPace / actualPace) * 100;
}

/**
 * Modifies EPH based on non-linear fatigue for ultra-distance races.
 * @param {number} baseEph - The base EPH.
 * @param {number} timeInHours - The estimated time in hours.
 * @param {string} routeType - The route type.
 * @param {number} altitude - The altitude.
 * @param {boolean} isUltraRace - True if it's an ultra-distance race.
 * @returns {object} An object containing the final EPH and fatigue factor.
 */
export function getAdvancedEPH(baseEph, timeInHours, routeType, altitude, isUltraRace) {
    const terrainFactors = {
        'road': 0.92,
        'fire_trail': 1.0,
        'technical': 1.35,
        'alpine': 1.8
    };
    const terrainFactor = terrainFactors[routeType] || 1.0;

    const gravityFactor = (altitude || 0) > 2000 ? 1 + (altitude / 10000) : 1;

    let fatigueFactor = 1.0;
    if (isUltraRace && timeInHours > 2) { // Apply non-linear fatigue for races longer than 2 hours
        // Simplified non-linear fatigue model: logarithmic decay
        // The longer the time, the more the fatigue factor reduces EPH
        fatigueFactor = 1 - (Math.log10(timeInHours + 1) / 2); 
        fatigueFactor = Math.max(0.5, fatigueFactor); // Ensure fatigue factor doesn't drop below 0.5
    }

    const finalEph = baseEph * terrainFactor * gravityFactor * fatigueFactor;

    return {
        finalEph,
        terrainFactor,
        gravityFactor,
        fatigueFactor
    };
}

/**
 * 將小時轉換為 HH:MM:SS 格式
 * @param {number} timeInHours - 小時數
 * @returns {string} 格式化後的時間字串
 */
export function formatTime(timeInHours) {
    if (isNaN(timeInHours) || timeInHours < 0) {
        return '00:00:00';
    }
    const hours = Math.floor(timeInHours);
    const minutes = Math.floor((timeInHours - hours) * 60);
    const seconds = Math.floor((((timeInHours - hours) * 60) - minutes) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * 將時、分、秒轉換為小時
 * @param {number} h - 小時
 * @param {number} m - 分鐘
 * @param {number} s - 秒
 * @returns {number} 總小時數
 */
export function hmsToHours(h, m, s) {
    return (parseInt(h, 10) || 0) + (parseInt(m, 10) || 0) / 60 + (parseInt(s, 10) || 0) / 3600;
}

/**
 * 計算 EP (Equivalent Pace)
 * @param {number} distance - 距離 (km)
 * @param {number} elevation - 爬升 (m)
 * @returns {number} EP 值
 */
export function calculateEP(distance, elevation) {
    return (distance || 0) + ((elevation || 0) / 100);
}

/**
 * 計算 EPH (Equivalent Pace per Hour)
 * @param {number} ep - EP 值
 * @param {number} timeInHours - 時間 (小時)
 * @returns {number} EPH 值
 */
export function calculateEPH(ep, timeInHours) {
    if (timeInHours <= 0) return 0;
    return ep / timeInHours;
}

/**
 * Converts pace in hours per kilometer to a formatted string 'MM:SS/km'.
 * @param {number} paceInHoursPerKm - Pace in hours per kilometer.
 * @returns {string} Formatted pace string.
 */
export function paceToMinutesPerKm(paceInHoursPerKm) {
    if (isNaN(paceInHoursPerKm) || paceInHoursPerKm <= 0) {
        return '0:00/km';
    }
    const totalSeconds = paceInHoursPerKm * 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}

/**
 * Converts pace from minutes and seconds per km to hours per km.
 * @param {number} minutes - The minutes part of the pace.
 * @param {number} seconds - The seconds part of the pace.
 * @returns {number} Pace in hours per kilometer.
 */
export function minutesPerKmToHoursPerKm(minutes, seconds) {
    const totalSeconds = (minutes * 60) + seconds;
    return totalSeconds / 3600;
}

/**
 * Calculates equivalent pace based on distance and time.
 * For simplicity, this is flat ground pace.
 * @param {number} distance - Distance in km.
 * @param {number} timeInHours - Time in hours.
 * @returns {number} Pace in hours per kilometer.
 */
export function calculateEquivalentPace(distance, timeInHours) {
    if (distance <= 0 || timeInHours <= 0) {
        return 0;
    }
    return timeInHours / distance;
}

/**
 * Recommends training paces based on a base equivalent pace and specific training distances.
 * Uses a logarithmic adjustment for interval pace and a linear adjustment for LSD pace.
 * @param {number} basePaceInHoursPerKm - The runner's current equivalent pace from a race.
 * @param {number} intervalDistanceMeters - The distance for the interval workout in meters.
 * @param {number} lsdDistanceKm - The distance for the LSD run in kilometers.
 * @returns {object} An object containing paces for different training types.
 */
export function getTrainingPaces(basePaceInHoursPerKm, intervalDistanceMeters = 400, lsdDistanceKm = 20) {
    if (basePaceInHoursPerKm <= 0) {
        return {
            interval: 0,
            lsd: 0,
            recovery: 0
        };
    }

    // --- Interval Pace Calculation ---
    const i_ref_dist = 800; // meters
    const i_ref_factor = 0.95; // 95% of base pace time
    const i_k = 0.05; // Factor adjustment per doubling of distance
    const i_dist_adj = Math.log2(intervalDistanceMeters / i_ref_dist);
    let intervalPaceFactor = i_ref_factor + (i_dist_adj * i_k);
    intervalPaceFactor = Math.max(0.85, Math.min(1.05, intervalPaceFactor));

    // --- LSD Pace Calculation ---
    const lsd_ref_dist = 20; // km
    const lsd_ref_factor = 1.25; // 125% of base pace time
    const lsd_k = 0.025; // Factor adjustment per 10km increase
    const lsd_dist_adj = (lsdDistanceKm - lsd_ref_dist) / 10;
    let lsdPaceFactor = lsd_ref_factor + (lsd_dist_adj * lsd_k);
    lsdPaceFactor = Math.max(1.20, Math.min(1.35, lsdPaceFactor)); // Clamp to reasonable bounds

    // --- Recovery Pace (fixed) ---
    const recoveryPaceFactor = 1.35;

    return {
        interval: basePaceInHoursPerKm * intervalPaceFactor,
        lsd: basePaceInHoursPerKm * lsdPaceFactor,
        recovery: basePaceInHoursPerKm * recoveryPaceFactor
    };
}


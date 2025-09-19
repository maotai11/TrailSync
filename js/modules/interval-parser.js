
/**
 * Parses a multi-set interval string like "90s*8 85s*2"
 * @param {Array} intervalSets - An array of objects, e.g., [{time: 90, count: 8}, {time: 85, count: 2}].
 * @returns {Array|null} The validated array of objects, or null if invalid.
 */
export function parseIntervals(intervalSets) {
    if (!Array.isArray(intervalSets)) return null;
    // Basic validation: ensure each set has time and count
    const validSets = intervalSets.filter(set => 
        typeof set.time === 'number' && set.time > 0 &&
        typeof set.count === 'number' && set.count > 0
    );
    return validSets.length > 0 ? validSets : null;
}

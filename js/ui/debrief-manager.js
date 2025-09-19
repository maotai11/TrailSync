const DEBRIEF_STORAGE_KEY = 'trailSyncDebriefs';

/**
 * Retrieves all debrief entries from localStorage.
 * @returns {Array} An array of debrief objects.
 */
export function getDebriefs() {
    const debriefs = localStorage.getItem(DEBRIEF_STORAGE_KEY);
    return debriefs ? JSON.parse(debriefs) : [];
}

/**
 * Saves a new debrief entry to the collection.
 * @param {object} debriefData - The debrief object to add.
 */
export function saveDebrief(debriefData) {
    const debriefs = getDebriefs();
    const newDebrief = {
        id: `debrief_${Date.now()}`,
        type: 'debrief', // Mark as debrief entry
        ...debriefData,
        savedAt: new Date().toISOString()
    };
    debriefs.push(newDebrief);
    localStorage.setItem(DEBRIEF_STORAGE_KEY, JSON.stringify(debriefs));
}

/**
 * Deletes a debrief entry from the collection.
 * @param {string} debriefId - The ID of the debrief to delete.
 */
export function deleteDebrief(debriefId) {
    let debriefs = getDebriefs();
    debriefs = debriefs.filter(d => d.id !== debriefId);
    localStorage.setItem(DEBRIEF_STORAGE_KEY, JSON.stringify(debriefs));
}

/**
 * Updates a specific debrief entry.
 * @param {string} debriefId - The ID of the debrief to update.
 * @param {object} updatedData - The new data for the debrief entry.
 */
export function updateDebrief(debriefId, updatedData) {
    const debriefs = getDebriefs();
    const index = debriefs.findIndex(d => d.id === debriefId);
    if (index !== -1) {
        debriefs[index] = { ...debriefs[index], ...updatedData };
        localStorage.setItem(DEBRIEF_STORAGE_KEY, JSON.stringify(debriefs));
    }
}

/**
 * Clears all debrief entries from the collection.
 */
export function clearDebriefs() {
    localStorage.removeItem(DEBRIEF_STORAGE_KEY);
}
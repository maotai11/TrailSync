const SHOE_STORAGE_KEY = 'trailSyncShoes';

/**
 * Retrieves all shoes from localStorage.
 * @returns {Array} An array of shoe objects.
 */
export function getShoes() {
    const shoes = localStorage.getItem(SHOE_STORAGE_KEY);
    return shoes ? JSON.parse(shoes) : [];
}

/**
 * Saves the entire array of shoes to localStorage.
 * @param {Array} shoes - The array of shoe objects to save.
 */
function saveAllShoes(shoes) {
    localStorage.setItem(SHOE_STORAGE_KEY, JSON.stringify(shoes));
}

/**
 * Adds a new shoe to the collection.
 * @param {object} shoeData - The shoe object to add (e.g., { name, brand, initialMileage }).
 */
export function addShoe(shoeData) {
    const shoes = getShoes();
    const newShoe = {
        id: `shoe_${Date.now()}`,
        name: shoeData.name,
        brand: shoeData.brand,
        initialMileage: parseFloat(shoeData.initialMileage) || 0,
        currentMileage: parseFloat(shoeData.initialMileage) || 0,
        addedDate: new Date().toISOString()
    };
    shoes.push(newShoe);
    saveAllShoes(shoes);
}

/**
 * Updates the mileage of a specific shoe.
 * @param {string} shoeId - The ID of the shoe to update.
 * @param {number} runDistance - The distance of the run to add to the shoe's mileage.
 */
export function updateShoeMileage(shoeId, runDistance) {
    const shoes = getShoes();
    const shoeIndex = shoes.findIndex(s => s.id === shoeId);

    if (shoeIndex > -1) {
        shoes[shoeIndex].currentMileage += parseFloat(runDistance);
        saveAllShoes(shoes);
    }
}

/**
 * Deletes a shoe from the collection.
 * @param {string} shoeId - The ID of the shoe to delete.
 */
export function deleteShoe(shoeId) {
    let shoes = getShoes();
    shoes = shoes.filter(s => s.id !== shoeId);
    saveAllShoes(shoes);
}
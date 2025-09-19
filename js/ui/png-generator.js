
/**
 * Generates a transparent PNG from a DOM element and triggers download.
 * @param {HTMLElement} element - The DOM element to capture.
 * @param {string} filename - The desired filename for the downloaded image.
 */
export function exportElementAsPng(element, filename = 'trail-card.png', html2canvasOptions = {}) {
    if (!element) {
        console.error('Element for PNG export not found.');
        return;
    }

    // Use html2canvas to render the element
    html2canvas(element, {
        backgroundColor: null, // Crucial for transparency
        scale: 2, // Increase resolution for better quality
        ...html2canvasOptions // Merge additional options
    }).then(canvas => {
        // Create a link element
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png');
        
        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }).catch(err => {
        console.error('Error exporting PNG:', err);
    });
}

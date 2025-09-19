
// GPX 文件解析器

/**
 * 解析 GPX 文件內容
 * @param {string} gpxContent - GPX 文件的 XML 文本內容
 * @returns {object|null} 包含距離、爬升、下降等資訊的物件，或在失敗時返回 null
 */
export function parseGPX(gpxContent) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxContent, "text/xml");

    const trkpts = xmlDoc.getElementsByTagName('trkpt');
    if (trkpts.length < 2) {
        console.error("GPX file must contain at least two trackpoints.");
        return null;
    }

    let totalDistance = 0;
    let totalElevationGain = 0;
    let totalElevationLoss = 0;
    const points = [];

    for (let i = 0; i < trkpts.length; i++) {
        const lat = parseFloat(trkpts[i].getAttribute('lat'));
        const lon = parseFloat(trkpts[i].getAttribute('lon'));
        const eleNode = trkpts[i].getElementsByTagName('ele')[0];
        const ele = eleNode ? parseFloat(eleNode.textContent) : 0;
        points.push({ lat, lon, ele });

        if (i > 0) {
            const prevPoint = points[i - 1];
            totalDistance += haversineDistance(prevPoint, points[i]);
            const eleDiff = ele - prevPoint.ele;
            if (eleDiff > 0) {
                totalElevationGain += eleDiff;
            } else {
                totalElevationLoss += Math.abs(eleDiff);
            }
        }
    }

    return {
        distance: totalDistance,
        elevation: totalElevationGain,
        descent: totalElevationLoss,
        points: points
    };
}

/**
 * 使用 Haversine 公式計算兩點之間的距離
 * @param {{lat: number, lon: number}} p1 - 點 1
 * @param {{lat: number, lon: number}} p2 - 點 2
 * @returns {number} 距離 (km)
 */
function haversineDistance(p1, p2) {
    const R = 6371; // 地球半徑 (km)
    const dLat = toRad(p2.lat - p1.lat);
    const dLon = toRad(p2.lon - p1.lon);
    const lat1 = toRad(p1.lat);
    const lat2 = toRad(p2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(value) {
    return value * Math.PI / 180;
}

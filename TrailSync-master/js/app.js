import { formatTime, hmsToHours, calculateEP, calculateEPH, getAdvancedEPH, calculateThresholdPercentage } from './core/calculator.js';
import { parseGPX } from './core/gpx-parser.js';
import { calculateGAP } from './modules/gap-ngp.js';
import { parseIntervals } from './modules/interval-parser.js';
import { getTrainingHistory, saveTrainingToHistory, clearTrainingHistory } from './ui/history-manager.js';
import { exportElementAsPng } from './ui/png-generator.js';
import { getShoes, addShoe, updateShoeMileage, deleteShoe } from './ui/shoe-manager.js';
import { saveDebrief, getDebriefs, clearDebriefs, deleteDebrief, updateDebrief } from './ui/debrief-manager.js';
import { TrainingPaceCalculator } from './ui/training-pace-calculator.js';
import { Router } from './ui/router.js';

function convertTreadmillToPace(speed, incline) {
    if (speed <= 0) return 0;
    const pacePerKm = 60 / speed;
    const inclineEffect = incline * 0.15;
    return pacePerKm + inclineEffect;
}

function convertPaceToTreadmillSpeed(pace, incline) {
    if (pace <= 0) return 0;
    const speed = 60 / (pace - (incline * 0.15));
    return speed;
}

class TrailSyncApp {
    constructor() {
        this.editingDebriefId = null;
        this.cacheDOMElements();
        this.addEventListeners();
        this.loadShoes();
        this.loadHistory();
        this.intervalSetCounter = 0;
        this.initializeDebriefCalendar();
        this.trainingPaceCalculator = new TrainingPaceCalculator();
        this.router = new Router();
    }

    cacheDOMElements() {
        this.routeNameInput = document.getElementById('route-name');
        this.distanceInput = document.getElementById('distance');
        this.elevationInput = document.getElementById('elevation');
        this.targetHoursInput = document.getElementById('target-hours');
        this.targetMinutesInput = document.getElementById('target-minutes');
        this.targetSecondsInput = document.getElementById('target-seconds');
        this.routeTypeSelect = document.getElementById('route-type');
        this.altitudeInput = document.getElementById('altitude');
        this.userTPaceInput = document.getElementById('user-t-pace');
        this.ultraRaceCheckbox = document.getElementById('ultra-race-checkbox');
        this.calculateBtn = document.getElementById('calculate-btn');
        this.resultsPaneOnPage = document.getElementById('results-pane-onpage');
        this.resDistanceDisplay = document.getElementById('res-distance');
        this.resElevationDisplay = document.getElementById('res-elevation');
        this.resTimeDisplay = document.getElementById('res-time');
        this.ephDisplay = document.getElementById('eph');
        this.exportCardBtn = document.getElementById('export-card-btn');
        this.cardExporterContent = document.getElementById('card-exporter-content');
        this.runShoeSelector = document.getElementById('run-shoe-selector');

        // Interval Elements
        this.intervalModeTimeBtn = document.getElementById('interval-mode-time');
        this.intervalModePaceBtn = document.getElementById('interval-mode-pace');
        this.intervalTimeInputs = document.getElementById('interval-time-inputs');
        this.intervalPaceInputs = document.getElementById('interval-pace-inputs');
        this.intervalDistanceInput = document.getElementById('interval-distance');
        this.intervalCalculateBtn = document.getElementById('interval-calculate');
        this.intervalResultsList = document.getElementById('interval-results-list');
        this.intervalSetsContainer = document.getElementById('interval-sets-container');
        this.addIntervalSetBtn = document.getElementById('add-interval-set-btn');
        this.clearIntervalSetsBtn = document.getElementById('clear-interval-sets-btn');
        this.intervalTotalDistanceDisplay = document.getElementById('interval-total-distance');
        this.intervalTotalTimeDisplay = document.getElementById('interval-total-time');
        this.intervalTargetPaceMin = document.getElementById('interval-target-pace-min');
        this.intervalTargetPaceSec = document.getElementById('interval-target-pace-sec');
        this.intervalPaceReps = document.getElementById('interval-pace-reps');

        this.gapPaceInput = document.getElementById('gap-pace');
        this.gapGradeInput = document.getElementById('gap-grade');
        this.gapCalculateBtn = document.getElementById('gap-calculate');
        this.gapResultDisplay = document.getElementById('gap-result');

        this.treadmillSpeedInput = document.getElementById('treadmill-speed');
        this.treadmillInclineInput = document.getElementById('treadmill-incline');
        this.treadmillConvertBtn = document.getElementById('treadmill-convert');
        this.equivalentPaceDisplay = document.getElementById('equivalent-pace');
        this.flatPaceInput = document.getElementById('flat-pace-input');
        this.reverseTreadmillInclineInput = document.getElementById('reverse-treadmill-incline');
        this.reverseTreadmillConvertBtn = document.getElementById('reverse-treadmill-convert-btn');
        this.treadmillSpeedResultDisplay = document.getElementById('treadmill-speed-result');

        this.raceDistanceInput = document.getElementById('race-distance');
        this.raceElevationGainInput = document.getElementById('race-elevation-gain');
        this.raceElevationLossInput = document.getElementById('race-elevation-loss');
        this.userEphInput = document.getElementById('user-eph');
        this.racePredictBtn = document.getElementById('race-predict');
        this.raceTimeDisplay = document.getElementById('race-time');
        this.raceEpDisplay = document.getElementById('race-ep');

        this.saveTrainingBtn = document.getElementById('save-training');
        this.historyList = document.getElementById('history-list');
        this.clearHistoryBtn = document.getElementById('clear-history');

        this.shoeNameInput = document.getElementById('shoe-name');
        this.shoeBrandInput = document.getElementById('shoe-brand');
        this.shoeMileageInput = document.getElementById('shoe-mileage');
        this.addShoeBtn = document.getElementById('add-shoe-btn');
        this.shoeListContainer = document.getElementById('shoe-list');

        this.debriefRaceNameInput = document.getElementById('debrief-race-name');
        this.debriefDateInput = document.getElementById('debrief-date');
        this.debriefActualTimeInput = document.getElementById('debrief-actual-time');
        this.debriefMentalStateInput = document.getElementById('debrief-mental-state');
        this.debriefNutritionInput = document.getElementById('debrief-nutrition');
        this.debriefGearInput = document.getElementById('debrief-gear');
        this.debriefSubmitBtn = document.getElementById('debrief-submit');
        this.debriefCalendarContainer = document.getElementById('debrief-calendar');

        // Race Predictor v2
        this.refRaceDistInput = document.getElementById('ref-race-dist');
        this.refRaceElevInput = document.getElementById('ref-race-elev');
        this.refRaceTimeHInput = document.getElementById('ref-race-time-h');
        this.refRaceTimeMInput = document.getElementById('ref-race-time-m');
        this.refRaceTimeSInput = document.getElementById('ref-race-time-s');
        this.trainDistInput = document.getElementById('train-dist');
        this.trainElevInput = document.getElementById('train-elev');
        this.calculateTrainingTimeBtn = document.getElementById('calculate-training-time-btn');
        this.trainingTimeResultDisplay = document.getElementById('training-time-result');
        this.refRaceEphResultDisplay = document.getElementById('ref-race-eph-result');

        // Advanced Prediction
        this.advancedStrategySection = document.getElementById('advanced-strategy-section');
        this.climbingFactorInput = document.getElementById('climbing-factor');
        this.descendingFactorInput = document.getElementById('descending-factor');
        this.aidStationContainer = document.getElementById('aid-station-container');
        this.addAidStationBtn = document.getElementById('add-aid-station-btn');
    }

    addEventListeners() {
        this.calculateBtn.addEventListener('click', () => this.handleCalculation());
        this.intervalCalculateBtn.addEventListener('click', () => this.handleIntervalCalculation());
        this.gapCalculateBtn.addEventListener('click', () => this.handleGapCalculation());
        this.treadmillConvertBtn.addEventListener('click', () => this.handleTreadmillConversion());
        this.racePredictBtn.addEventListener('click', () => this.handleRacePrediction());
        this.saveTrainingBtn.addEventListener('click', () => this.saveCurrentTraining());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.exportCardBtn.addEventListener('click', () => this.handleExportCard());
        this.addShoeBtn.addEventListener('click', () => this.handleAddShoe());
        this.debriefSubmitBtn.addEventListener('click', () => this.handleDebriefSubmit());
        this.addIntervalSetBtn.addEventListener('click', () => this.addIntervalSetRow());
        this.clearIntervalSetsBtn.addEventListener('click', () => this.clearIntervalSets());
        this.reverseTreadmillConvertBtn.addEventListener('click', () => this.handleReverseTreadmillConversion());
        this.calculateTrainingTimeBtn.addEventListener('click', () => this.handleTrainingTimeCalculation());

        // Advanced Prediction Listeners
        this.addAidStationBtn.addEventListener('click', () => this.handleAddAidStation());

        // Interval mode switching
        this.intervalModeTimeBtn.addEventListener('click', () => this.switchIntervalMode('time'));
        this.intervalModePaceBtn.addEventListener('click', () => this.switchIntervalMode('pace'));

        this.shoeListContainer.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('shoe-delete-btn')) {
                const shoeId = e.target.dataset.id;
                this.handleDeleteShoe(shoeId);
            }
            if (e.target && e.target.classList.contains('shoe-add-mileage-btn')) {
                const shoeId = e.target.dataset.id;
                this.handleAddMileage(shoeId);
            }
            if (e.target && e.target.classList.contains('shoe-edit-btn')) {
                const shoeId = e.target.dataset.id;
                this.handleEditShoe(shoeId);
            }
        });

        this.debriefCalendarContainer.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('debrief-delete-btn')) {
                const debriefId = e.target.dataset.id;
                this.handleDeleteDebrief(debriefId);
            }
            if (e.target && e.target.classList.contains('debrief-edit-btn')) {
                const debriefId = e.target.dataset.id;
                this.handleEditDebrief(debriefId);
            }
        });
    }

    switchIntervalMode(mode) {
        if (mode === 'time') {
            this.intervalModeTimeBtn.classList.add('active');
            this.intervalModePaceBtn.classList.remove('active');
            this.intervalTimeInputs.style.display = 'block';
            this.intervalPaceInputs.style.display = 'none';
        } else {
            this.intervalModeTimeBtn.classList.remove('active');
            this.intervalModePaceBtn.classList.add('active');
            this.intervalTimeInputs.style.display = 'none';
            this.intervalPaceInputs.style.display = 'block';
        }
        this.clearIntervalSets(); // Reset results when switching modes
    }

    handleCalculation() {
        const distance = parseFloat(this.distanceInput.value) || 0;
        const elevation = parseFloat(this.elevationInput.value) || 0;
        const timeInHours = hmsToHours(this.targetHoursInput.value, this.targetMinutesInput.value, this.targetSecondsInput.value);
        const routeType = this.routeTypeSelect.value;
        const altitude = parseFloat(this.altitudeInput.value) || 0;
        const isUltra = this.ultraRaceCheckbox.checked;

        if (distance <= 0 || timeInHours <= 0) {
            alert('請輸入有效的距離和時間。');
            return;
        }

        const ep = calculateEP(distance, elevation);
        const baseEph = calculateEPH(ep, timeInHours);

        const { finalEph } = getAdvancedEPH(baseEph, timeInHours, routeType, altitude, isUltra);

        this.resDistanceDisplay.textContent = `${distance.toFixed(1)} km`;
        this.resElevationDisplay.textContent = `${elevation.toFixed(0)} m`;
        this.resTimeDisplay.textContent = formatTime(timeInHours);
        this.ephDisplay.textContent = finalEph.toFixed(1);
    }

    loadShoes() {
        const shoes = getShoes();
        this.shoeListContainer.innerHTML = '';
        this.runShoeSelector.innerHTML = '<option value="">不指定</option>';
        if (shoes.length === 0) {
            this.shoeListContainer.innerHTML = '<p class="history-empty">尚未加入任何跑鞋</p>';
            return;
        }
        shoes.forEach(shoe => {
            this.renderShoeCard(shoe);
            this.addShoeToSelector(shoe);
        });
    }

    renderShoeCard(shoe) {
        const card = document.createElement('div');
        card.className = 'shoe-card';
        card.dataset.id = shoe.id;
        const retirement = 800;
        const pct = Math.min((shoe.currentMileage / retirement) * 100, 100);
        card.innerHTML = `
            <div class="shoe-header">
                <div>
                    <h4 class="shoe-name">${shoe.name}</h4>
                    <p class="shoe-brand">${shoe.brand}</p>
                </div>
                <div>
                    <button class="shoe-edit-btn" data-id="${shoe.id}">編輯</button>
                    <button class="shoe-delete-btn" data-id="${shoe.id}">&times;</button>
                </div>
            </div>
            <div class="mileage-info">
                <div class="mileage-bar-container"><div class="mileage-bar" style="width: ${pct}%;"></div></div>
                <p class="mileage-text">${shoe.currentMileage.toFixed(1)} / ${retirement} km</p>
                <button class="shoe-add-mileage-btn" data-id="${shoe.id}">新增里程</button>
            </div>
        `;
        this.shoeListContainer.appendChild(card);
    }

    addShoeToSelector(shoe) {
        const opt = document.createElement('option');
        opt.value = shoe.id;
        opt.textContent = `${shoe.name} (${shoe.brand})`;
        this.runShoeSelector.appendChild(opt);
    }

    handleAddShoe() {
        const name = this.shoeNameInput.value.trim();
        const brand = this.shoeBrandInput.value.trim();
        const initial = parseFloat(this.shoeMileageInput.value) || 0;
        if (!name || !brand) { alert('請輸入跑鞋型號和品牌。'); return; }
        addShoe({ name, brand, initialMileage: initial });
        this.shoeNameInput.value = '';
        this.shoeBrandInput.value = '';
        this.shoeMileageInput.value = '';
        this.loadShoes();
    }

    handleDeleteShoe(shoeId) {
        if (confirm('您確定要刪除這雙跑鞋嗎？')) { deleteShoe(shoeId); this.loadShoes(); }
    }

    handleAddMileage(shoeId) {
        const km = prompt('請輸入本次新增里程（km）：');
        if (km === null) return;
        const num = parseFloat(km);
        if (isNaN(num) || num <= 0) { alert('請輸入正數！'); return; }
        updateShoeMileage(shoeId, num);
        this.loadShoes();
        alert(`已為跑鞋新增 ${num.toFixed(1)} km！`);
    }

    handleEditShoe(shoeId) {
        const shoes = getShoes();
        const shoe = shoes.find(s => s.id === shoeId);
        if (!shoe) return;
        const newName = prompt('新名稱（留空保持原值）：', shoe.name);
        const newBrand = prompt('新品牌（留空保持原值）：', shoe.brand);
        const newMile = prompt('目前累積里程（km，留空保持原值）：', shoe.currentMileage.toFixed(1));
        if (newName === null && newBrand === null && newMile === null) return;
        const updated = {
            name: (newName || shoe.name).trim(),
            brand: (newBrand || shoe.brand).trim(),
            currentMileage: parseFloat(newMile) || shoe.currentMileage
        };
        updateShoeMileage(shoeId, 0); // 先寫 0 觸發更新介面
        const idx = shoes.findIndex(s => s.id === shoeId);
        shoes[idx] = { ...shoes[idx], ...updated };
        localStorage.setItem('shoes', JSON.stringify(shoes));
        this.loadShoes();
        alert('跑鞋資料已更新！');
    }

    handleDeleteDebrief(debriefId) {
        if (confirm('您確定要刪除這篇復盤日誌嗎？')) {
            deleteDebrief(debriefId);
            this.loadHistory();
            this.initializeDebriefCalendar();
        }
    }

    handleEditDebrief(debriefId) {
        const debriefs = getDebriefs();
        const debrief = debriefs.find(d => d.id === debriefId);
        if (!debrief) return;

        this.debriefRaceNameInput.value = debrief.raceName;
        this.debriefDateInput.value = debrief.date;
        this.debriefActualTimeInput.value = debrief.actualTime;
        this.debriefMentalStateInput.value = debrief.mentalState;
        this.debriefNutritionInput.value = debrief.nutrition;
        this.debriefGearInput.value = debrief.gear;

        this.debriefSubmitBtn.textContent = '更新復盤';
        this.editingDebriefId = debriefId;

        // Scroll to the form
        this.debriefRaceNameInput.scrollIntoView({ behavior: 'smooth' });
    }

    handleDebriefSubmit() {
        const entry = {
            raceName: this.debriefRaceNameInput.value.trim(),
            date: this.debriefDateInput.value,
            actualTime: this.debriefActualTimeInput.value.trim(),
            mentalState: this.debriefMentalStateInput.value.trim(),
            nutrition: this.debriefNutritionInput.value.trim(),
            gear: this.debriefGearInput.value.trim()
        };
        if (!entry.raceName || !entry.date) { alert('請至少輸入賽事名稱和日期。'); return; }

        if (this.editingDebriefId) {
            updateDebrief(this.editingDebriefId, entry);
            alert('賽後復盤已更新！');
            this.editingDebriefId = null;
            this.debriefSubmitBtn.textContent = '提交復盤';
        } else {
            saveDebrief(entry);
            alert('賽後復盤已提交！');
        }

        ['raceName', 'date', 'actualTime', 'mentalState', 'nutrition', 'gear']
            .forEach(k => this[`debrief${k.charAt(0).toUpperCase() + k.slice(1)}Input`].value = '');
        this.loadHistory();
        this.initializeDebriefCalendar();
    }

    loadHistory() {
        this.historyList.innerHTML = '';
        const tHist = getTrainingHistory();
        const dHist = getDebriefs();
        const combined = [...tHist, ...dHist].sort((a, b) => new Date(b.date) - new Date(a.date));
        if (combined.length === 0) {
            this.historyList.innerHTML = '<div class="history-empty">尚無歷史紀錄</div>';
            return;
        }
        combined.forEach(it => this.addHistoryEntryToDOM(it));
        this.initializeDebriefCalendar();
    }

    initializeDebriefCalendar() {
        if (!this.debriefCalendarContainer) return;
        const debriefs = getDebriefs().sort((a, b) => new Date(b.date) - new Date(a.date));
        this.debriefCalendarContainer.innerHTML = '';
        if (debriefs.length === 0) {
            this.debriefCalendarContainer.innerHTML = '<p class="history-empty">尚無復盤紀錄</p>';
            return;
        }
        debriefs.forEach(d => {
            const details = document.createElement('details');
            details.className = 'debrief-item';

            const summary = document.createElement('summary');
            summary.className = 'debrief-summary';
            summary.innerHTML = `<strong>${d.raceName}</strong> - <small>${new Date(d.date).toLocaleDateString('zh-Hant')}</small>`;

            const content = document.createElement('div');
            content.className = 'debrief-content';
            content.innerHTML = `
                <p><strong>完賽時間:</strong> ${d.actualTime || '未記錄'}</p>
                <p><strong>心態感受:</strong> ${d.mentalState || '未記錄'}</p>
                <p><strong>補給策略:</strong> ${d.nutrition || '未記錄'}</p>
                <p><strong>裝備表現:</strong> ${d.gear || '未記錄'}</p>
                <div class="debrief-actions">
                    <button class="btn btn-outline btn-small debrief-edit-btn" data-id="${d.id}">編輯</button>
                    <button class="btn btn-danger btn-small debrief-delete-btn" data-id="${d.id}">刪除</button>
                </div>
            `;

            details.appendChild(summary);
            details.appendChild(content);
            this.debriefCalendarContainer.appendChild(details);
        });
    }

    addHistoryEntryToDOM(entry) {
        const empty = this.historyList.querySelector('.history-empty');
        if (empty) empty.remove();
        let html = '';
        if (entry.type === 'debrief') {
            html = `
                <p class="history-date">${new Date(entry.date).toLocaleDateString('zh-Hant')} - <strong>賽後復盤: ${entry.raceName}</strong></p>
                <div class="history-metrics">
                    <div><p class="history-metric-name">完賽時間</p><p class="history-metric-value">${entry.actualTime || '未記錄'}</p></div>
                    <div><p class="history-metric-name">心態</p><p class="history-metric-value">${entry.mentalState ? '已記錄' : '未記錄'}</p></div>
                    <div><p class="history-metric-name">補給</p><p class="history-metric-value">${entry.nutrition ? '已記錄' : '未記錄'}</p></div>
                    <div><p class="history-metric-name">裝備</p><p class="history-metric-value">${entry.gear ? '已記錄' : '未記錄'}</p></div>
                </div>`;
        } else {
            const shoes = getShoes();
            const shoe = entry.shoeId ? shoes.find(s => s.id === entry.shoeId) : null;
            const shoeName = shoe ? shoe.name : '';

            html = `
                <p class="history-date">${new Date(entry.date).toLocaleDateString('zh-Hant')} - <strong>${entry.name || '無標題'}</strong></p>
                <div class="history-metrics">
                    <div><p class="history-metric-name">距離</p><p class="history-metric-value">${entry.distance} km</p></div>
                    <div><p class="history-metric-name">爬升</p><p class="history-metric-value">${entry.elevation} m</p></div>
                    <div><p class="history-metric-name">時間</p><p class="history-metric-value">${formatTime(entry.time)}</p></div>
                    <div><p class="history-metric-name">EPH</p><p class="metric-value">${entry.eph.toFixed(1)}</p></div>
                    ${shoeName ? `<div><p class="history-metric-name">跑鞋</p><p class="history-metric-value">${shoeName}</p></div>` : ''}
                </div>`;
        }
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = html;
        this.historyList.prepend(item);
    }

    addIntervalSetRow() {
        this.intervalSetCounter++;
        const div = document.createElement('div');
        div.className = 'form-group interval-set';
        div.innerHTML = `
            <label class="form-label">單趟間歇時間 (秒)</label>
            <input type="number" class="form-control interval-seconds" placeholder="例如: 90">
            <label class="form-label">次數</label>
            <input type="number" class="form-control interval-count" placeholder="例如: 8">
        `;
        this.intervalSetsContainer.appendChild(div);
    }

    clearIntervalSets() {
        this.intervalSetCounter = 0;
        const sets = this.intervalSetsContainer.querySelectorAll('.interval-set');
        sets.forEach((s, i) => { if (i > 0) s.remove(); });
        sets[0]?.querySelectorAll('input').forEach(inp => inp.value = '');
        this.intervalResultsList.innerHTML = '';
        this.intervalTotalDistanceDisplay.textContent = '0 km';
        this.intervalTotalTimeDisplay.textContent = '00:00:00';
    }

    handleIntervalCalculation() {
        const distance = parseFloat(this.intervalDistanceInput.value) || 0;
        if (distance <= 0) {
            this.intervalResultsList.innerHTML = '<p class="metric-name">請輸入有效的間歇距離</p>';
            return;
        }

        const userTPace = parseFloat(this.userTPaceInput.value) || 0;
        let totalDist = 0, totalSec = 0;
        this.intervalResultsList.innerHTML = '';

        // Mode check
        if (this.intervalModeTimeBtn.classList.contains('active')) {
            // Existing "by time" logic
            const sets = [];
            this.intervalSetsContainer.querySelectorAll('.interval-set').forEach(set => {
                const sec = parseInt(set.querySelector('.interval-seconds').value, 10);
                const cnt = parseInt(set.querySelector('.interval-count').value, 10);
                if (!isNaN(sec) && !isNaN(cnt) && sec > 0 && cnt > 0) sets.push({ time: sec, count: cnt });
            });

            if (sets.length === 0) {
                this.intervalResultsList.innerHTML = '<p class="metric-name">請輸入有效的間歇數據</p>';
                return;
            }

            sets.forEach((st, idx) => {
                const pace = (st.time / 60) / (distance / 1000);
                const min = Math.floor(pace), sec = Math.round((pace - min) * 60);
                let pct = '';
                if (userTPace > 0) pct = ` (${calculateThresholdPercentage(pace, userTPace).toFixed(0)}% T-Pace)`;
                totalDist += (distance / 1000) * st.count;
                totalSec += st.time * st.count;
                this.intervalResultsList.innerHTML += `
                    <div class="metric-item">
                        <span class="metric-number">${String(idx + 1).padStart(2, '0')}</span>
                        <div class="metric-content">
                            <h3 class="metric-name">第 ${idx + 1} 組配速 (${st.count} 趟)</h3>
                            <p class="metric-value">${min}:${String(sec).padStart(2, '0')}/km${pct}</p>
                        </div>
                    </div>`;
            });
        } else {
            // New "by pace" logic
            const paceMin = parseInt(this.intervalTargetPaceMin.value, 10) || 0;
            const paceSec = parseInt(this.intervalTargetPaceSec.value, 10) || 0;
            const reps = parseInt(this.intervalPaceReps.value, 10) || 0;

            if (reps <= 0 || (paceMin <= 0 && paceSec <= 0)) {
                this.intervalResultsList.innerHTML = '<p class="metric-name">請輸入有效的目標配速和次數</p>';
                return;
            }

            const totalPaceSecondsPerKm = (paceMin * 60) + paceSec;
            const secondsPerMeter = totalPaceSecondsPerKm / 1000;
            const timePerRep = secondsPerMeter * distance;

            const repMin = Math.floor(timePerRep / 60);
            const repSec = Math.round(timePerRep % 60);

            totalDist = (distance / 1000) * reps;
            totalSec = timePerRep * reps;

            this.intervalResultsList.innerHTML = `
                <div class="metric-item">
                    <span class="metric-number">${String(reps).padStart(2, '0')}</span>
                    <div class="metric-content">
                        <h3 class="metric-name">單趟時間 (${reps} 趟)</h3>
                        <p class="metric-value">${repMin}:${String(repSec).padStart(2, '0')}</p>
                    </div>
                </div>`;
        }

        this.intervalTotalDistanceDisplay.textContent = `${totalDist.toFixed(2)} km`;
        this.intervalTotalTimeDisplay.textContent = formatTime(totalSec / 3600);
    }

    handleGapCalculation() {
        const pace = parseFloat(this.gapPaceInput.value) || 0;
        const grade = parseFloat(this.gapGradeInput.value) || 0;
        if (pace <= 0) return;
        const gap = calculateGAP(pace, grade);
        const min = Math.floor(gap), sec = Math.round((gap - min) * 60);
        this.gapResultDisplay.textContent = `${min}:${String(sec).padStart(2, '0')}/km`;
    }

    handleTreadmillConversion() {
        const speed = parseFloat(this.treadmillSpeedInput.value) || 0;
        const incline = parseFloat(this.treadmillInclineInput.value) || 0;
        if (speed <= 0) return;
        const pace = convertTreadmillToPace(speed, incline);
        const min = Math.floor(pace), sec = Math.round((pace - min) * 60);
        this.equivalentPaceDisplay.textContent = `${min}:${String(sec).padStart(2, '0')}/km`;
    }

    handleReverseTreadmillConversion() {
        const flatPace = parseFloat(this.flatPaceInput.value) || 0;
        const incline = parseFloat(this.reverseTreadmillInclineInput.value) || 0;
        if (flatPace <= 0) { alert('請輸入有效的目標平路配速。'); return; }
        const speed = convertPaceToTreadmillSpeed(flatPace, incline);
        this.treadmillSpeedResultDisplay.textContent = `${speed.toFixed(1)} km/h`;
    }

    handleRacePrediction() {
        // --- Get Base Inputs ---
        const D = parseFloat(this.raceDistanceInput.value) || 0;
        const G_plus = parseFloat(this.raceElevationGainInput.value) || 0;
        const G_minus = parseFloat(this.raceElevationLossInput.value) || 0;
        const eph = parseFloat(this.userEphInput.value) || 0;

        if (D <= 0 || eph <= 0) {
            alert('請輸入有效的賽事距離、爬升/下降和您的平均EPH。');
            return;
        }

        // --- Convert EPH (speed) to eHP (pace) ---
        const targetEhpInMinutes = 60 / eph;

        // --- Define Coefficients ---
        const Kg = 100; // 爬升難度係數
        const Kd = 200; // 下降難度係數 (折中值)

        // --- Check for Advanced Mode ---
        const isAdvancedMode = this.advancedStrategySection.open;
        const AG = parseFloat(this.climbingFactorInput.value) || 1.0; // 爬坡能力係數
        const AD = parseFloat(this.descendingFactorInput.value) || 1.0; // 下坡能力係數
        
        const aidStations = [];
        this.aidStationContainer.querySelectorAll('.aid-station-group').forEach(group => {
            const dist = parseFloat(group.querySelector('.aid-station-dist').value);
            const time = parseFloat(group.querySelector('.aid-station-time').value);
            if (!isNaN(dist) && !isNaN(time) && dist > 0 && time > 0) {
                aidStations.push({ distance: dist, time: time });
            }
        });

        let equivalentDistance = 0;
        let mode = "(標準)";

        if (isAdvancedMode && (AG !== 1.0 || AD !== 1.0)) {
            // --- Personalized Formula (Level 3) ---
            mode = "(進階)";
            equivalentDistance = D + (G_plus / (Kg * AG)) + (G_minus / (Kd * AD));
        } else {
            // --- Baseline Formula (Level 2) ---
            equivalentDistance = D + (G_plus / Kg) + (G_minus / Kd);
        }

        let totalMinutes = equivalentDistance * targetEhpInMinutes;

        // Add aid station time if in advanced mode
        if (isAdvancedMode && aidStations.length > 0) {
            const totalAidStationMinutes = aidStations.reduce((total, station) => total + station.time, 0);
            totalMinutes += totalAidStationMinutes;
            if (mode === "(標準)") mode = "(進階-補給站)"; // Indicate that aid stations were used
        }

        const totalHours = totalMinutes / 60;

        this.raceTimeDisplay.textContent = formatTime(totalHours) + ` ${mode}`;
        this.raceEpDisplay.textContent = `${equivalentDistance.toFixed(1)} ekm`;
    }

    handleTrainingTimeCalculation() {
        const refRaceDist = parseFloat(this.refRaceDistInput.value) || 0;
        const refRaceElev = parseFloat(this.refRaceElevInput.value) || 0;
        const refRaceTime = hmsToHours(this.refRaceTimeHInput.value, this.refRaceTimeMInput.value, this.refRaceTimeSInput.value);

        const trainDist = parseFloat(this.trainDistInput.value) || 0;
        const trainElev = parseFloat(this.trainElevInput.value) || 0;

        if (refRaceDist <= 0 || refRaceTime <= 0 || trainDist < 0) {
            alert('請輸入有效的參考賽事數據和訓練距離。');
            return;
        }

        const refRaceEP = calculateEP(refRaceDist, refRaceElev);
        const refRaceEPH = calculateEPH(refRaceEP, refRaceTime);

        if (isNaN(refRaceEPH) || !isFinite(refRaceEPH)) {
            alert('無法計算參考賽事的 EPH，請檢查輸入值。');
            return;
        }

        const trainEP = calculateEP(trainDist, trainElev);
        const estimatedTrainingTime = trainEP / refRaceEPH; // in hours

        this.refRaceEphResultDisplay.textContent = refRaceEPH.toFixed(1);
        this.trainingTimeResultDisplay.textContent = formatTime(estimatedTrainingTime);
    }

    handleAddAidStation() {
        const stationIndex = this.aidStationContainer.children.length;
        const stationDiv = document.createElement('div');
        stationDiv.className = 'form-group-inline aid-station-group';
        stationDiv.innerHTML = `
            <div class="form-group">
                <label for="aid-dist-${stationIndex}" class="form-label">補給站 ${stationIndex + 1} (km)</label>
                <input type="number" id="aid-dist-${stationIndex}" class="form-control aid-station-dist" placeholder="距離">
            </div>
            <div class="form-group">
                <label for="aid-time-${stationIndex}" class="form-label">停留時間 (分)</label>
                <input type="number" id="aid-time-${stationIndex}" class="form-control aid-station-time" placeholder="分鐘">
            </div>
            <button class="btn btn-danger btn-small remove-aid-station-btn">&times;</button>
        `;
        this.aidStationContainer.appendChild(stationDiv);

        stationDiv.querySelector('.remove-aid-station-btn').addEventListener('click', () => {
            stationDiv.remove();
        });
    }

    saveCurrentTraining() {
        const routeName = this.routeNameInput.value.trim() || '未命名訓練';
        const distance = parseFloat(this.distanceInput.value);
        const entry = {
            date: new Date().toISOString(),
            name: routeName,
            distance: distance,
            elevation: this.elevationInput.value,
            time: hmsToHours(this.targetHoursInput.value, this.targetMinutesInput.value, this.targetSecondsInput.value),
            eph: parseFloat(this.ephDisplay.textContent) || 0,
            type: 'training',
            shoeId: this.runShoeSelector.value || null
        };
        if (!entry.distance || !entry.time) { alert('沒有可儲存的有效訓練數據。'); return; }
        
        saveTrainingToHistory(entry);

        if (entry.shoeId && entry.distance > 0) {
            updateShoeMileage(entry.shoeId, entry.distance);
            this.loadShoes(); 
        }

        this.loadHistory();
        alert(`已儲存訓練: ${routeName}`);
    }

    handleExportCard() {
        const distance = this.resDistanceDisplay.textContent;
        const elevation = this.resElevationDisplay.textContent;
        const time = this.resTimeDisplay.textContent;
        const eph = this.ephDisplay.textContent;
        const div = document.createElement('div');
        div.style.width = '400px';
        div.style.height = '400px';
        div.style.position = 'absolute';
        div.style.left = '-9999px';
        div.style.background = '#fff';
        div.style.display = 'grid';
        div.style.gridTemplateColumns = '1fr 1fr';
        div.style.gap = '10px';
        div.style.padding = '10px';
        div.style.fontFamily = '"Noto Sans SC", sans-serif';
        div.style.color = 'rgba(51,51,51,.8)';
        div.innerHTML = `
            <div style="text-align:center;display:flex;flex-direction:column;justify-content:center;"><h3 style="margin:0;font-size:1.1em;">距離</h3><p style="font-size:1.3em;font-weight:bold;margin:0;">${distance}</p></div>
            <div style="text-align:center;display:flex;flex-direction:column;justify-content:center;"><h3 style="margin:0;font-size:1.1em;">總爬升</h3><p style="font-size:1.3em;font-weight:bold;margin:0;">${elevation}</p></div>
            <div style="text-align:center;display:flex;flex-direction:column;justify-content:center;"><h3 style="margin:0;font-size:1.1em;">用時</h3><p style="font-size:1.3em;font-weight:bold;margin:0;">${time}</p></div>
            <div style="text-align:center;display:flex;flex-direction:column;justify-content:center;"><h3 style="margin:0;font-size:1.1em;">EPH</h3><p style="font-size:1.3em;font-weight:bold;margin:0;">${eph}</p></div>
        `;
        document.body.appendChild(div);
        exportElementAsPng(div, `TrailSync-Card-${Date.now()}.png`, { width: 400, height: 400 });
        setTimeout(() => document.body.removeChild(div), 200);
    }

    handleGPXUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const gpx = parseGPX(e.target.result);
                if (gpx) {
                    this.distanceInput.value = gpx.distance.toFixed(2);
                    this.elevationInput.value = gpx.elevation.toFixed(0);
                    alert(`GPX 已載入: ${gpx.distance.toFixed(2)} km, ${gpx.elevation.toFixed(0)} m`);
                } else {
                    alert('無法解析 GPX 檔案。');
                }
            } catch (err) {
                alert('解析 GPX 檔案時發生錯誤。');
            }
        };
        reader.readAsText(file);
    }

    clearHistory() {
        if (confirm('您確定要清除所有歷史紀錄嗎？')) {
            clearTrainingHistory();
            clearDebriefs();
            this.loadHistory();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TrailSyncApp();
});
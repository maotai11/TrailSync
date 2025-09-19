import { hmsToHours, calculateEquivalentPace, getTrainingPaces, paceToMinutesPerKm, minutesPerKmToHoursPerKm } from '../core/calculator.js';

export class TrainingPaceCalculator {
    constructor() {
        this.cacheDOMElements();
        this.addEventListeners();
        this.init();
    }

    init() {
        // Initial calculation on load can be done here if needed
    }

    cacheDOMElements() {
        // Input mode
        this.modeCurrentBtn = document.getElementById('tpc-mode-current');
        this.modeTargetBtn = document.getElementById('tpc-mode-target');

        // Distance
        this.distanceInput = document.getElementById('tpc-distance');

        // Input type
        this.inputTypeTimeBtn = document.getElementById('tpc-input-time');
        this.inputTypePaceBtn = document.getElementById('tpc-input-pace');
        this.timeGroup = document.getElementById('tpc-time-group');
        this.paceGroup = document.getElementById('tpc-pace-group');

        // Time inputs
        this.hoursInput = document.getElementById('tpc-hours');
        this.minutesInput = document.getElementById('tpc-minutes');
        this.secondsInput = document.getElementById('tpc-seconds');

        // Pace inputs
        this.paceMinInput = document.getElementById('tpc-pace-min');
        this.paceSecInput = document.getElementById('tpc-pace-sec');

        // Calculate button
        this.calculateBtn = document.getElementById('tpc-calculate');

        // Result elements
        this.basePaceOutput = document.getElementById('tpc-base-pace');
        
        // Interval results
        this.intervalDistInput = document.getElementById('tpc-interval-dist');
        this.intervalRepsInput = document.getElementById('tpc-interval-reps');
        this.intervalPaceOutput = document.getElementById('tpc-interval-pace');
        this.intervalRecoveryOutput = document.getElementById('tpc-interval-recovery');

        // LSD results
        this.lsdDistInput = document.getElementById('tpc-lsd-dist');
        this.lsdPaceOutput = document.getElementById('tpc-lsd-pace');
        this.lsdRecoveryOutput = document.getElementById('tpc-lsd-recovery');

        // Copy button
        this.copyBtn = document.getElementById('copy-tpc-results');
    }

    addEventListeners() {
        this.inputTypeTimeBtn.addEventListener('click', () => this.toggleInputType('time'));
        this.inputTypePaceBtn.addEventListener('click', () => this.toggleInputType('pace'));
        this.calculateBtn.addEventListener('click', () => this.calculateAndDisplay());
        
        // Recalculate on input change for immediate feedback
        this.intervalDistInput.addEventListener('input', () => this.calculateAndDisplay());
        this.lsdDistInput.addEventListener('input', () => this.calculateAndDisplay());

        if(this.copyBtn) this.copyBtn.addEventListener('click', () => this.copyResults());
    }

    copyResults() {
        if (this.basePaceOutput.textContent === '0:00/km') {
            alert('沒有結果可以複製。');
            return;
        }

        const textToCopy = `
訓練配速計算結果：
- 基準配速: ${this.basePaceOutput.textContent}

間歇跑 (Interval)
- 趟數距離: ${this.intervalDistInput.value || 'N/A'} m
- 趟數: ${this.intervalRepsInput.value || 'N/A'}
- 建議配速: ${this.intervalPaceOutput.textContent}
- 恢復跑: ${this.intervalRecoveryOutput.textContent}

長距離慢跑 (LSD)
- LSD 距離: ${this.lsdDistInput.value || 'N/A'} km
- 建議配速: ${this.lsdPaceOutput.textContent}
- 恢復跑: ${this.lsdRecoveryOutput.textContent}
        `.trim().replace(/^ +/gm, ''); // trim and remove leading spaces

        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('結果已複製到剪貼簿！');
        }).catch(err => {
            console.error('無法複製文字: ', err);
            alert('複製失敗，請檢查瀏覽器權限。');
        });
    }

    toggleInputType(type) {
        if (type === 'time') {
            this.timeGroup.style.display = 'block';
            this.paceGroup.style.display = 'none';
            this.inputTypeTimeBtn.classList.add('active');
            this.inputTypePaceBtn.classList.remove('active');
        } else {
            this.timeGroup.style.display = 'none';
            this.paceGroup.style.display = 'block';
            this.inputTypeTimeBtn.classList.remove('active');
            this.inputTypePaceBtn.classList.add('active');
        }
    }

    calculateAndDisplay() {
        const distance = parseFloat(this.distanceInput.value);
        let timeInHours;

        if (this.inputTypeTimeBtn.classList.contains('active')) {
            const hours = parseInt(this.hoursInput.value) || 0;
            const minutes = parseInt(this.minutesInput.value) || 0;
            const seconds = parseInt(this.secondsInput.value) || 0;
            timeInHours = hmsToHours(hours, minutes, seconds);
        } else {
            const paceMinutes = parseInt(this.paceMinInput.value) || 0;
            const paceSeconds = parseInt(this.paceSecInput.value) || 0;
            if (distance > 0) {
                const paceInHoursPerKm = minutesPerKmToHoursPerKm(paceMinutes, paceSeconds);
                timeInHours = paceInHoursPerKm * distance;
            } else {
                timeInHours = 0;
            }
        }

        if (!distance || distance <= 0 || !timeInHours || timeInHours <= 0) {
            // Clear results if input is invalid
            this.basePaceOutput.textContent = '0:00/km';
            this.intervalPaceOutput.textContent = '0:00/km';
            this.intervalRecoveryOutput.textContent = '0:00/km';
            this.lsdPaceOutput.textContent = '0:00/km';
            this.lsdRecoveryOutput.textContent = '0:00/km';
            return;
        }

        const intervalDistance = parseFloat(this.intervalDistInput.value) || 400;
        const lsdDistance = parseFloat(this.lsdDistInput.value) || 20;
        const basePace = calculateEquivalentPace(distance, timeInHours);
        const trainingPaces = getTrainingPaces(basePace, intervalDistance, lsdDistance);

        this.basePaceOutput.textContent = paceToMinutesPerKm(basePace);
        
        // Interval pace doesn't depend on interval distance, but the display might in future
        this.intervalPaceOutput.textContent = paceToMinutesPerKm(trainingPaces.interval);
        this.intervalRecoveryOutput.textContent = paceToMinutesPerKm(trainingPaces.recovery);

        // LSD pace doesn't depend on LSD distance
        this.lsdPaceOutput.textContent = paceToMinutesPerKm(trainingPaces.lsd);
        this.lsdRecoveryOutput.textContent = paceToMinutesPerKm(trainingPaces.recovery); // Often same recovery pace
    }
}


import { hmsToHours } from '../core/calculator.js';
import { generateWorkout } from '../core/training-planner.js';

export class TrainingPlanUI {
    constructor(notifier) {
        this.notifier = notifier;
        this.cacheDOMElements();
        if (this.generateBtn) { // Only add listeners if the element exists
            this.addEventListeners();
        }
    }

    cacheDOMElements() {
        // Mode Buttons
        this.modeResultBtn = document.getElementById('plan-mode-result');
        this.modeGoalBtn = document.getElementById('plan-mode-goal');
        this.resultGroup = document.getElementById('plan-result-group');
        this.goalGroup = document.getElementById('plan-goal-group');

        // Result Inputs
        this.resultDist = document.getElementById('plan-result-dist');
        this.resultHours = document.getElementById('plan-result-hours');
        this.resultMinutes = document.getElementById('plan-result-minutes');
        this.resultSeconds = document.getElementById('plan-result-seconds');

        // Goal Inputs
        this.goalDist = document.getElementById('plan-goal-dist');
        this.goalHours = document.getElementById('plan-goal-hours');
        this.goalMinutes = document.getElementById('plan-goal-minutes');
        this.goalSeconds = document.getElementById('plan-goal-seconds');

        // Main Workout Inputs
        this.mainType = document.getElementById('plan-main-type');
        this.mainDetails = document.getElementById('plan-main-details');
        this.mainPace = document.getElementById('plan-main-pace');

        // Warmup Inputs
        this.warmupTimeBtn = document.getElementById('plan-warmup-time');
        this.warmupDistBtn = document.getElementById('plan-warmup-dist');
        this.warmupValue = document.getElementById('plan-warmup-value');
        this.warmupLabel = document.querySelector('label[for="plan-warmup-value"]');

        // Generate Button
        this.generateBtn = document.getElementById('plan-generate-btn');

        // Result Display
        this.resWarmup = document.getElementById('plan-res-warmup');
        this.resWarmupPace = document.getElementById('plan-res-warmup-pace');
        this.resWarmupCompact = document.getElementById('plan-res-warmup-compact');
        this.resWarmupPaceCompact = document.getElementById('plan-res-warmup-pace-compact');
        this.resMainTitle = document.getElementById('plan-res-main-title');
        this.resMainPace = document.getElementById('plan-res-main-pace');
        this.resMainCompact = document.getElementById('plan-res-main-compact');
        this.resMainPaceCompact = document.getElementById('plan-res-main-pace-compact');
        this.resCooldown = document.getElementById('plan-res-cooldown');
        this.resCooldownPace = document.getElementById('plan-res-cooldown-pace');
        this.resCooldownCompact = document.getElementById('plan-res-cooldown-compact');
        this.resCooldownPaceCompact = document.getElementById('plan-res-cooldown-pace-compact');

        // Copy Button
        this.copyBtn = document.getElementById('copy-plan-results');
    }

    addEventListeners() {
        this.modeResultBtn.addEventListener('click', () => this.toggleMode('result'));
        this.modeGoalBtn.addEventListener('click', () => this.toggleMode('goal'));
        this.warmupTimeBtn.addEventListener('click', () => this.toggleWarmupInput('time'));
        this.warmupDistBtn.addEventListener('click', () => this.toggleWarmupInput('dist'));
        this.generateBtn.addEventListener('click', () => this.calculateAndDisplay());
        if(this.copyBtn) this.copyBtn.addEventListener('click', (e) => this.copyResults(e.currentTarget));
    }

    copyResults(button) {
        if (this.resWarmup.textContent === '--') {
            alert('沒有課表可以複製。');
            return;
        }

        const textToCopy = `
TrailSync 課表建議：

- 熱身: ${this.resWarmup.textContent}
  ${this.resWarmupPace.textContent}

- 主課表: ${this.resMainTitle.textContent}
  ${this.resMainPace.textContent}

- 緩和: ${this.resCooldown.textContent}
  ${this.resCooldownPace.textContent}
        `.trim().replace(/^ +/gm, '');

        navigator.clipboard.writeText(textToCopy).then(() => {
            if (this.notifier) {
                this.notifier(button);
            } else {
                alert('課表已複製到剪貼簿！');
            }
        }).catch(err => {
            console.error('無法複製文字: ', err);
            alert('複製失敗，請檢查瀏覽器權限。');
        });
    }

    toggleMode(mode) {
        if (mode === 'result') {
            this.resultGroup.style.display = 'block';
            this.goalGroup.style.display = 'none';
            this.modeResultBtn.classList.add('active');
            this.modeGoalBtn.classList.remove('active');
        } else {
            this.resultGroup.style.display = 'none';
            this.goalGroup.style.display = 'block';
            this.modeResultBtn.classList.remove('active');
            this.modeGoalBtn.classList.add('active');
        }
    }

    toggleWarmupInput(type) {
        if (type === 'time') {
            this.warmupLabel.textContent = '時間 (分鐘) 或 距離 (公里)';
            this.warmupValue.placeholder = '例如: 15 (分鐘)';
            this.warmupTimeBtn.classList.add('active');
            this.warmupDistBtn.classList.remove('active');
        } else {
            this.warmupLabel.textContent = '距離 (公里) 或 時間 (分鐘)';
            this.warmupValue.placeholder = '例如: 2 (公里)';
            this.warmupTimeBtn.classList.remove('active');
            this.warmupDistBtn.classList.add('active');
        }
    }

    calculateAndDisplay() {
        // 1. Gather Base Race Info
        let baseRace = {};
        if (this.modeResultBtn.classList.contains('active')) {
            baseRace.distance = parseFloat(this.resultDist.value);
            baseRace.timeInHours = hmsToHours(this.resultHours.value, this.resultMinutes.value, this.resultSeconds.value);
        } else {
            baseRace.distance = parseFloat(this.goalDist.value);
            baseRace.timeInHours = hmsToHours(this.goalHours.value, this.goalMinutes.value, this.goalSeconds.value);
        }

        if (!baseRace.distance || !baseRace.timeInHours) {
            alert('請輸入有效的比賽成績或目標時間。');
            return;
        }

        // 2. Gather Main Workout Info
        const mainWorkout = {
            type: this.mainType.value,
            details: this.mainDetails.value,
            targetPace: this.mainPace.value
        };

        // 3. Gather Warmup Info
        const warmup = {
            type: this.warmupTimeBtn.classList.contains('active') ? 'time' : 'distance',
            value: parseFloat(this.warmupValue.value)
        };

        if (!warmup.value) {
            alert('請輸入有效的熱身時間或距離。');
            return;
        }

        // 4. Generate Workout
        const workoutPlan = generateWorkout({ baseRace, mainWorkout, warmup });

        // 5. Display Results
        this.resWarmup.textContent = workoutPlan.warmup.text;
        this.resWarmupCompact.textContent = workoutPlan.warmup.text;
        let warmupPaceText = `配速: ${workoutPlan.warmup.pace}`;
        if(workoutPlan.warmup.strides){
            warmupPaceText += ` + ${workoutPlan.warmup.strides}`;
        }
        this.resWarmupPace.textContent = warmupPaceText;
        this.resWarmupPaceCompact.textContent = workoutPlan.warmup.pace;

        this.resMainTitle.textContent = `${workoutPlan.main.type}: ${workoutPlan.main.details}`;
        this.resMainCompact.textContent = `${workoutPlan.main.type}: ${workoutPlan.main.details}`;
        this.resMainPace.textContent = `配速: ${workoutPlan.main.pace}`;
        this.resMainPaceCompact.textContent = workoutPlan.main.pace;

        this.resCooldown.textContent = workoutPlan.cooldown.text;
        this.resCooldownCompact.textContent = workoutPlan.cooldown.text;
        this.resCooldownPace.textContent = `配速: ${workoutPlan.cooldown.pace}`;
        this.resCooldownPaceCompact.textContent = workoutPlan.cooldown.pace;
    }
}

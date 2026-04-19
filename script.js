/**
 * Health Command Center - Main Application Script
 */

// Application State
const app = {
    state: {
        currentDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        data: null // Holds the entire loaded data structure
    },
    ui: {},
    actions: {},
    utils: {}
};

// Default Sample Data (Seeded on first load)
const DEFAULT_DATA = {
    profile: {
        name: "User",
        age: 27,
        gender: "Male",
        weight: 94,
        goal: "Fat loss + muscle retention"
    },
    targets: {
        calories: 1800,
        protein: 170,
        carbs: 130,
        fats: 60,
        water: 3.5 // in Liters
    },
    history: {}, // Keyed by YYYY-MM-DD
    settings: {
        theme: "dark"
    }
};

/**
 * Generate 7 days of realistic historical data based on user profile
 */
function generateHistoricalData() {
    const history = {};
    const today = new Date();

    // Base workouts
    const workoutPlans = [
        "Chest + Triceps",
        "Back + Biceps",
        "Legs",
        "Shoulders",
        "Full Body + Core",
        "Rest",
        "Rest"
    ];

    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        // Randomize slight variations
        const calVar = Math.floor(Math.random() * 300) - 100; // -100 to +200
        const proVar = Math.floor(Math.random() * 20) - 10;

        history[dateStr] = {
            macros: {
                calories: DEFAULT_DATA.targets.calories + calVar,
                protein: DEFAULT_DATA.targets.protein + proVar,
                carbs: DEFAULT_DATA.targets.carbs + Math.floor(calVar/8),
                fats: DEFAULT_DATA.targets.fats + Math.floor(calVar/18)
            },
            water: Math.max(2.0, (DEFAULT_DATA.targets.water - (Math.random() * 1.5))).toFixed(1),
            weight: (DEFAULT_DATA.profile.weight + (i * 0.05)).toFixed(1), // slight downward trend
            workout: {
                planned: workoutPlans[(today.getDay() - i + 7) % 7],
                completed: Math.random() > 0.3 && i !== 0 // 70% chance completed, except today
            },
            meals: [
                { id: `m1_${dateStr}`, name: "Breakfast", desc: "3 eggs, oats, black coffee", calories: 400, protein: 25, completed: i !== 0 },
                { id: `m2_${dateStr}`, name: "Lunch", desc: "Chicken curry, 2 roti, salad", calories: 600, protein: 45, completed: i !== 0 },
                { id: `m3_${dateStr}`, name: "Snack", desc: "Whey protein, roasted chana", calories: 250, protein: 30, completed: i !== 0 },
                { id: `m4_${dateStr}`, name: "Dinner", desc: "Paneer bhurji, vegetables", calories: 550, protein: 35, completed: false }
            ],
            supplements: {
                whey: i !== 0,
                creatine: i !== 0,
                omega3: Math.random() > 0.2,
                vitd: Math.random() > 0.2
            },
            habits: {
                walk: Math.random() > 0.4,
                nosugar: Math.random() > 0.3,
                sleep: Math.random() > 0.2
            }
        };

        // Clear some data for "today" to let the user fill it
        if (i === 0) {
            history[dateStr].macros = { calories: 0, protein: 0, carbs: 0, fats: 0 };
            history[dateStr].water = 0;
            history[dateStr].workout.completed = false;
            // Meals left uncompleted
        }

        // Ensure exercises array exists
        if (!history[dateStr].workout.exercises) {
            history[dateStr].workout.exercises = [];
        }
    }

    return history;
}

// === Data Persistence Functions ===

app.utils.loadData = function() {
    const saved = localStorage.getItem('health_dash_data');
    if (saved) {
        try {
            app.state.data = JSON.parse(saved);
        } catch (e) {
            console.error("Error parsing saved data, falling back to defaults.", e);
            app.utils.initDefaults();
        }
    } else {
        app.utils.initDefaults();
    }

    // Ensure today's entry exists
    if (!app.state.data.history[app.state.currentDate]) {
        app.utils.createNewDay(app.state.currentDate);
    }
};

app.utils.saveData = function() {
    localStorage.setItem('health_dash_data', JSON.stringify(app.state.data));
};

app.utils.initDefaults = function() {
    app.state.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    app.state.data.history = generateHistoricalData();
    app.utils.saveData();
};

app.utils.createNewDay = function(dateStr) {
    const today = new Date(dateStr);
    const workoutPlans = ["Chest + Triceps", "Back + Biceps", "Legs", "Shoulders", "Full Body + Core", "Rest", "Rest"];

    app.state.data.history[dateStr] = {
        macros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        water: 0,
        weight: app.state.data.profile.weight,
        workout: {
            planned: workoutPlans[today.getDay()],
            completed: false,
            exercises: []
        },
        meals: [
            { id: `m1_${Date.now()}`, name: "Breakfast", desc: "3 eggs, oats, black coffee", calories: 400, protein: 25, completed: false },
            { id: `m2_${Date.now()}`, name: "Lunch", desc: "Chicken curry, 2 roti, salad", calories: 600, protein: 45, completed: false },
            { id: `m3_${Date.now()}`, name: "Snack", desc: "Whey protein, roasted chana", calories: 250, protein: 30, completed: false },
            { id: `m4_${Date.now()}`, name: "Dinner", desc: "Paneer bhurji, vegetables", calories: 550, protein: 35, completed: false }
        ],
        supplements: { whey: false, creatine: false, omega3: false, vitd: false },
        habits: { walk: false, nosugar: false, sleep: false }
    };
    app.utils.saveData();
};

// === Toast Notifications ===
app.ui.showToast = function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Add icon based on type
    let icon = '';
    if (type === 'success') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (type === 'error') {
        icon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);

    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);

    // Animate out and remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300); // Wait for transition
    }, 3000);
};

// === Slide-Over Panel Logic ===
app.ui.openPanel = function(type, data = null) {
    const overlay = document.getElementById('slide-panel-overlay');
    const panel = document.getElementById('slide-panel');
    const title = document.getElementById('panel-title');
    const content = document.getElementById('panel-content');

    if (!overlay || !panel) return;

    app.ui.renderPanelContent(type, data, title, content);

    overlay.classList.add('active');
    panel.classList.add('open');

    // Prevent background scrolling on mobile
    document.body.style.overflow = 'hidden';
};

app.ui.closePanel = function() {
    const overlay = document.getElementById('slide-panel-overlay');
    const panel = document.getElementById('slide-panel');

    if (overlay && panel) {
        panel.classList.remove('open');
        overlay.classList.remove('active');

        // Restore background scrolling
        document.body.style.overflow = '';

        // Clear content after animation
        setTimeout(() => {
            const content = document.getElementById('panel-content');
            if (content) content.innerHTML = '';
        }, 300);
    }
};

app.ui.renderPanelContent = function(type, data, titleEl, contentEl) {
    let html = '';

    switch (type) {
        case 'add-macro':
            titleEl.textContent = 'Add Quick Macro';
            html = `
                <form id="panel-form" data-type="add-macro">
                    <div class="form-group">
                        <label>Food Item (Optional)</label>
                        <input type="text" id="macro-name" class="form-control" placeholder="e.g. Apple">
                    </div>
                    <div class="form-group">
                        <label>Calories (kcal)</label>
                        <input type="number" id="macro-cal" class="form-control" placeholder="0" required min="0">
                    </div>
                    <div class="grid-layout" style="grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                        <div>
                            <label style="font-size: 0.75rem;">Protein (g)</label>
                            <input type="number" id="macro-pro" class="form-control" placeholder="0" min="0">
                        </div>
                        <div>
                            <label style="font-size: 0.75rem;">Carbs (g)</label>
                            <input type="number" id="macro-carb" class="form-control" placeholder="0" min="0">
                        </div>
                        <div>
                            <label style="font-size: 0.75rem;">Fats (g)</label>
                            <input type="number" id="macro-fat" class="form-control" placeholder="0" min="0">
                        </div>
                    </div>
                    <button type="submit" class="btn-primary w-full mt-4">Add to Today</button>
                </form>
            `;
            break;

        case 'add-meal':
            titleEl.textContent = 'Log Meal';
            html = `
                <form id="panel-form" data-type="add-meal">
                    <div class="form-group">
                        <label>Meal Type</label>
                        <select id="meal-type" class="form-control">
                            <option value="Breakfast">Breakfast</option>
                            <option value="Lunch">Lunch</option>
                            <option value="Snack">Snack</option>
                            <option value="Dinner">Dinner</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Description / Foods</label>
                        <textarea id="meal-desc" class="form-control" rows="3" placeholder="e.g. Chicken curry, 2 roti..."></textarea>
                    </div>
                    <div class="form-group">
                        <label>Estimated Calories</label>
                        <input type="number" id="meal-cal" class="form-control" placeholder="0" required min="0">
                    </div>
                    <div class="form-group">
                        <label>Estimated Protein (g)</label>
                        <input type="number" id="meal-pro" class="form-control" placeholder="0" required min="0">
                    </div>
                    <button type="submit" class="btn-primary w-full mt-4">Save Meal</button>
                </form>
            `;
            break;

        case 'log-workout':
            titleEl.textContent = 'Log Workout';
            const todayData = app.state.data.history[app.state.currentDate];
            const planned = todayData ? todayData.workout.planned : "Rest";
            const completed = todayData ? todayData.workout.completed : false;

            html = `
                <form id="panel-form" data-type="log-workout">
                    <div class="form-group">
                        <label>Planned Workout Focus</label>
                        <input type="text" id="workout-planned" class="form-control" value="${app.utils.escapeHTML(planned)}">
                    </div>

                    <h4 class="mt-4 mb-2">Log Exercise</h4>
                    <div class="form-group">
                        <label>Exercise Name</label>
                        <input type="text" id="ex-name" class="form-control" placeholder="e.g. Bench Press">
                    </div>
                    <div class="grid-layout" style="grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem;">
                        <div>
                            <label style="font-size: 0.75rem;">Sets</label>
                            <input type="number" id="ex-sets" class="form-control" placeholder="0" min="0">
                        </div>
                        <div>
                            <label style="font-size: 0.75rem;">Reps</label>
                            <input type="number" id="ex-reps" class="form-control" placeholder="0" min="0">
                        </div>
                        <div>
                            <label style="font-size: 0.75rem;">Weight</label>
                            <input type="number" id="ex-weight" class="form-control" placeholder="0" min="0">
                        </div>
                    </div>

                    <div class="form-group mt-4" style="display: flex; align-items: center; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                        <input type="checkbox" id="workout-completed" ${completed ? 'checked' : ''} style="width: 20px; height: 20px;">
                        <label for="workout-completed" style="margin-bottom: 0;">Mark Entire Workout as Completed</label>
                    </div>
                    <button type="submit" class="btn-primary w-full mt-4">Save Workout Status</button>
                </form>
            `;
            break;

        case 'log-weight':
            titleEl.textContent = 'Log Weight';
            const currentWeight = app.state.data.history[app.state.currentDate]?.weight || app.state.data.profile.weight;
            html = `
                <form id="panel-form" data-type="log-weight">
                    <div class="form-group">
                        <label>Body Weight (kg)</label>
                        <input type="number" step="0.1" id="weight-val" class="form-control" value="${currentWeight}" required>
                    </div>
                    <button type="submit" class="btn-primary w-full mt-4">Save Weight</button>
                </form>
            `;
            break;

        case 'settings':
            titleEl.textContent = 'Dashboard Settings';
            const targets = app.state.data.targets;
            html = `
                <form id="panel-form" data-type="settings">
                    <h4 class="mb-2">Daily Targets</h4>
                    <div class="form-group">
                        <label>Calories</label>
                        <input type="number" id="set-cal" class="form-control" value="${targets.calories}" required>
                    </div>
                    <div class="form-group">
                        <label>Protein (g)</label>
                        <input type="number" id="set-pro" class="form-control" value="${targets.protein}" required>
                    </div>
                    <div class="form-group">
                        <label>Carbs (g)</label>
                        <input type="number" id="set-carb" class="form-control" value="${targets.carbs}" required>
                    </div>
                    <div class="form-group">
                        <label>Fats (g)</label>
                        <input type="number" id="set-fat" class="form-control" value="${targets.fats}" required>
                    </div>
                    <div class="form-group">
                        <label>Water (L)</label>
                        <input type="number" step="0.1" id="set-water" class="form-control" value="${targets.water}" required>
                    </div>
                    <button type="submit" class="btn-primary w-full mt-4">Save Settings</button>

                    <button type="button" class="btn-outline w-full mt-4 text-danger" style="border-color: var(--danger)" onclick="app.actions.resetData()">
                        Reset All Data
                    </button>
                </form>
            `;
            break;

        default:
            html = '<p>Unknown panel type.</p>';
    }

    contentEl.innerHTML = html;

    // Attach form listener
    const form = document.getElementById('panel-form');
    if (form) {
        form.addEventListener('submit', app.actions.handleFormSubmit);
    }
};

app.actions.handleFormSubmit = function(e) {
    e.preventDefault();
    const type = e.target.dataset.type;
    const dayData = app.state.data.history[app.state.currentDate];

    if (type === 'add-macro') {
        const cal = parseInt(document.getElementById('macro-cal').value) || 0;
        const pro = parseInt(document.getElementById('macro-pro').value) || 0;
        const carb = parseInt(document.getElementById('macro-carb').value) || 0;
        const fat = parseInt(document.getElementById('macro-fat').value) || 0;

        dayData.macros.calories += cal;
        dayData.macros.protein += pro;
        dayData.macros.carbs += carb;
        dayData.macros.fats += fat;

        app.ui.showToast(`Added ${cal} kcal`);
    }
    else if (type === 'add-meal') {
        const name = document.getElementById('meal-type').value;
        const desc = document.getElementById('meal-desc').value;
        const cal = parseInt(document.getElementById('meal-cal').value) || 0;
        const pro = parseInt(document.getElementById('meal-pro').value) || 0;

        dayData.meals.push({
            id: `m_${Date.now()}`,
            name, desc, calories: cal, protein: pro, completed: true
        });

        // Auto-add macros for this meal
        dayData.macros.calories += cal;
        dayData.macros.protein += pro;

        app.ui.showToast(`Meal "${name}" logged`);
    }
    else if (type === 'log-workout') {
        const planned = document.getElementById('workout-planned').value;
        const completed = document.getElementById('workout-completed').checked;

        dayData.workout.planned = planned;
        dayData.workout.completed = completed;

        const exName = document.getElementById('ex-name').value;
        if (exName) {
            const sets = parseInt(document.getElementById('ex-sets').value) || 0;
            const reps = parseInt(document.getElementById('ex-reps').value) || 0;
            const weight = parseFloat(document.getElementById('ex-weight').value) || 0;

            dayData.workout.exercises.push({
                name: exName,
                sets, reps, weight
            });
            app.ui.showToast(`Logged ${exName}`);
        } else {
            app.ui.showToast(`Workout status updated`);
        }
    }
    else if (type === 'log-weight') {
        const weight = parseFloat(document.getElementById('weight-val').value);
        dayData.weight = weight;
        app.state.data.profile.weight = weight; // update profile baseline

        app.ui.showToast(`Weight logged: ${weight} kg`);
    }
    else if (type === 'settings') {
        app.state.data.targets.calories = parseInt(document.getElementById('set-cal').value);
        app.state.data.targets.protein = parseInt(document.getElementById('set-pro').value);
        app.state.data.targets.carbs = parseInt(document.getElementById('set-carb').value);
        app.state.data.targets.fats = parseInt(document.getElementById('set-fat').value);
        app.state.data.targets.water = parseFloat(document.getElementById('set-water').value);

        app.ui.showToast(`Settings saved`);
    }

    app.utils.saveData();
    app.ui.closePanel();
    app.ui.renderDashboard();
};

app.actions.resetData = function() {
    if (confirm("Are you sure you want to reset all data? This cannot be undone.")) {
        app.utils.initDefaults();
        app.state.currentDate = new Date().toISOString().split('T')[0];
        app.ui.updateDateDisplay();
        app.ui.closePanel();
        app.ui.showToast("Data reset to defaults");
        app.ui.renderDashboard();
    }
};

app.ui.setupPanelListeners = function() {
    const overlay = document.getElementById('slide-panel-overlay');
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) app.ui.closePanel();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') app.ui.closePanel();
    });
};

// === UI & Navigation Logic ===

app.ui.formatDate = function(dateStr) {
    const date = new Date(dateStr);
    const today = new Date().toISOString().split('T')[0];

    if (dateStr === today) return "Today, " + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateStr === tomorrow.toISOString().split('T')[0]) return "Tomorrow, " + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateStr === yesterday.toISOString().split('T')[0]) return "Yesterday, " + date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

app.ui.updateDateDisplay = function() {
    const btn = document.getElementById('current-date-btn');
    if (btn) {
        btn.textContent = app.ui.formatDate(app.state.currentDate);
    }
    const picker = document.getElementById('date-picker');
    if (picker) {
        picker.value = app.state.currentDate;
    }
};

app.actions.changeDate = function(offset) {
    const current = new Date(app.state.currentDate);
    current.setDate(current.getDate() + offset);
    const newDateStr = current.toISOString().split('T')[0];

    app.state.currentDate = newDateStr;

    if (!app.state.data.history[newDateStr]) {
        app.utils.createNewDay(newDateStr);
    }

    app.ui.updateDateDisplay();
    app.ui.renderDashboard();
    console.log("Date changed to:", newDateStr);
};

app.actions.setDate = function(dateStr) {
    app.state.currentDate = dateStr;
    if (!app.state.data.history[dateStr]) {
        app.utils.createNewDay(dateStr);
    }
    app.ui.updateDateDisplay();
    app.ui.renderDashboard();
};

app.ui.setupNavigationListeners = function() {
    document.getElementById('prev-date')?.addEventListener('click', () => app.actions.changeDate(-1));
    document.getElementById('next-date')?.addEventListener('click', () => app.actions.changeDate(1));

    const dateBtn = document.getElementById('current-date-btn');
    const datePicker = document.getElementById('date-picker');

    if (dateBtn && datePicker) {
        dateBtn.addEventListener('click', () => {
            try {
                datePicker.showPicker();
            } catch (e) {
                // Fallback for browsers that don't support showPicker
                datePicker.focus();
            }
        });

        datePicker.addEventListener('change', (e) => {
            if (e.target.value) {
                app.actions.setDate(e.target.value);
            }
        });
    }
};

// === Core Rendering ===

app.ui.renderDashboard = function() {
    const todayData = app.state.data.history[app.state.currentDate];
    const targets = app.state.data.targets;

    if (!todayData) return;

    app.ui.renderHero(todayData, targets);
    app.ui.renderMacros(todayData.macros, targets);
    app.ui.renderMeals(todayData.meals);
    app.ui.renderWorkouts(todayData.workout);
    app.ui.renderSupplements(todayData.supplements);
    app.ui.renderHabitsAndWater(todayData, targets);
    app.ui.renderCharts();
};

app.ui.renderHero = function(dayData, targets) {
    const calEl = document.getElementById('hero-cal-val');
    const calTargetEl = document.getElementById('hero-cal-target');
    const calBar = document.getElementById('hero-cal-bar');

    const proEl = document.getElementById('hero-pro-val');
    const proTargetEl = document.getElementById('hero-pro-target');
    const proBar = document.getElementById('hero-pro-bar');

    // Calories
    const calPct = Math.min(100, (dayData.macros.calories / targets.calories) * 100);
    calEl.textContent = dayData.macros.calories;
    calTargetEl.textContent = targets.calories;
    calBar.style.width = `${calPct}%`;

    // Protein
    const proPct = Math.min(100, (dayData.macros.protein / targets.protein) * 100);
    proEl.textContent = dayData.macros.protein;
    proTargetEl.textContent = targets.protein;
    proBar.style.width = `${proPct}%`;

    // Calculate Score (Simple logic: Cal adherence + Pro Adherence + Workout + Water)
    let score = 0;
    // Calorie score (up to 40) - penalize for being too low or too high
    const calDiff = Math.abs(targets.calories - dayData.macros.calories);
    const calScore = Math.max(0, 40 - (calDiff / targets.calories) * 40);
    score += calScore;

    // Protein score (up to 30)
    score += (Math.min(dayData.macros.protein, targets.protein) / targets.protein) * 30;

    // Workout score (15)
    if (dayData.workout.completed) score += 15;
    else if (dayData.workout.planned === "Rest") score += 15;

    // Water score (15)
    score += Math.min(15, (dayData.water / targets.water) * 15);

    score = Math.round(score);

    // Update Score Ring
    document.getElementById('hero-score-val').textContent = score;
    const ringPath = document.getElementById('score-ring-path');
    ringPath.setAttribute('stroke-dasharray', `${score}, 100`);

    // Smart Insights
    const insightEl = document.getElementById('hero-insight');
    if (score > 90) insightEl.textContent = "Incredible day! You are on point.";
    else if (dayData.macros.protein < targets.protein * 0.5) insightEl.textContent = "Protein intake is low today.";
    else if (dayData.water < targets.water * 0.5) insightEl.textContent = "Don't forget to hydrate!";
    else if (dayData.macros.calories > targets.calories) insightEl.textContent = "Slightly over calories today.";
    else insightEl.textContent = "Keep up the good work!";
};

app.ui.renderMacros = function(macros, targets) {
    const grid = document.getElementById('macro-grid');
    if (!grid) return;

    const macroItems = [
        { name: 'Protein', key: 'protein', val: macros.protein, target: targets.protein, unit: 'g', color: 'var(--primary)' },
        { name: 'Carbs', key: 'carbs', val: macros.carbs, target: targets.carbs, unit: 'g', color: 'var(--warning)' },
        { name: 'Fats', key: 'fats', val: macros.fats, target: targets.fats, unit: 'g', color: 'var(--danger)' }
    ];

    let html = '';
    macroItems.forEach(item => {
        const pct = Math.min(100, (item.val / item.target) * 100);
        html += `
            <div class="macro-card">
                <span class="macro-title">${item.name}</span>
                <span class="macro-val">${item.val}${item.unit} <small class="text-secondary" style="font-size: 0.75rem">/ ${item.target}</small></span>
                <div class="progress-bar-bg" style="height: 4px;">
                    <div class="progress-bar" style="width: ${pct}%; background: ${item.color}"></div>
                </div>
            </div>
        `;
    });

    // Add quick edit button card
    html += `
        <div class="macro-card" style="display: flex; align-items: center; justify-content: center; cursor: pointer; border: 1px dashed var(--border-color); background: transparent;" onclick="app.ui.openPanel('add-macro')">
            <span class="text-secondary">+ Quick Add</span>
        </div>
    `;

    grid.innerHTML = html;
};

app.ui.renderMeals = function(meals) {
    const list = document.getElementById('meal-list');
    if (!list) return;

    if (!meals || meals.length === 0) {
        list.innerHTML = '<p class="text-secondary text-center py-4">No meals logged for this day.</p>';
        return;
    }

    let html = '';
    meals.forEach(meal => {
        html += `
            <div class="meal-card ${meal.completed ? 'completed' : ''}">
                <div class="meal-header">
                    <span class="meal-name">${app.utils.escapeHTML(meal.name)}</span>
                    <span class="meal-macros">${meal.calories} kcal • ${meal.protein}g P</span>
                </div>
                <div class="meal-desc">${app.utils.escapeHTML(meal.desc)}</div>
                <div class="mt-2" style="display: flex; gap: 0.5rem;">
                    ${!meal.completed ?
                        `<button class="btn-text text-accent" style="padding: 0; min-height: auto; font-size: 0.85rem;" onclick="app.actions.completeMeal('${meal.id}')">✓ Mark Eaten</button>`
                        :
                        `<span class="text-success" style="font-size: 0.85rem;">✓ Eaten</span>`
                    }
                    <button class="btn-text text-danger" style="padding: 0; min-height: auto; font-size: 0.85rem; margin-left: auto;" onclick="app.actions.deleteMeal('${meal.id}')">Delete</button>
                </div>
            </div>
        `;
    });

    list.innerHTML = html;
};

app.actions.completeMeal = function(mealId) {
    const dayData = app.state.data.history[app.state.currentDate];
    const meal = dayData.meals.find(m => m.id === mealId);
    if (meal && !meal.completed) {
        meal.completed = true;
        // Add macros since it is now eaten
        dayData.macros.calories += meal.calories;
        dayData.macros.protein += meal.protein;

        app.utils.saveData();
        app.ui.renderDashboard();
        app.ui.showToast(`${meal.name} marked as eaten`);
    }
};

app.actions.deleteMeal = function(mealId) {
    const dayData = app.state.data.history[app.state.currentDate];
    const mealIndex = dayData.meals.findIndex(m => m.id === mealId);

    if (mealIndex > -1) {
        const meal = dayData.meals[mealIndex];

        // Only subtract macros if the meal was actually completed/eaten
        if (meal.completed) {
            dayData.macros.calories = Math.max(0, dayData.macros.calories - meal.calories);
            dayData.macros.protein = Math.max(0, dayData.macros.protein - meal.protein);
        }

        dayData.meals.splice(mealIndex, 1);
        app.utils.saveData();
        app.ui.renderDashboard();
        app.ui.showToast(`Meal deleted`);
    }
};

app.ui.renderWorkouts = function(workoutData) {
    const container = document.getElementById('workout-content');
    if (!container) return;

    let isRest = workoutData.planned.toLowerCase().includes('rest');
    let statusClass = workoutData.completed ? 'text-success' : 'text-warning';
    let statusText = workoutData.completed ? '✓ Completed' : 'Pending';

    if (isRest) {
        statusClass = 'text-secondary';
        statusText = 'Rest Day';
    }

    let html = `
        <div class="meal-card" style="border-left-color: ${workoutData.completed ? 'var(--success)' : (isRest ? 'var(--border-color)' : 'var(--primary)')}">
            <div class="meal-header">
                <span class="meal-name">${app.utils.escapeHTML(workoutData.planned)}</span>
                <span class="meal-macros ${statusClass}">${statusText}</span>
            </div>
    `;

    if (workoutData.exercises && workoutData.exercises.length > 0) {
        html += `<div style="margin: 0.5rem 0; font-size: 0.85rem; border-top: 1px solid var(--border-color); padding-top: 0.5rem;">`;
        workoutData.exercises.forEach(ex => {
            html += `<div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <span class="text-secondary">${app.utils.escapeHTML(ex.name)}</span>
                <span>${ex.sets}s × ${ex.reps}r @ ${ex.weight}</span>
            </div>`;
        });
        html += `</div>`;
    }

    html += `
            <div class="mt-2">
                <button class="btn-outline w-full" style="min-height: 36px; padding: 0.5rem;" onclick="app.ui.openPanel('log-workout')">
                    Log Exercise / Update Status
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;
};

app.ui.renderSupplements = function(supps) {
    const list = document.getElementById('supplement-list');
    if (!list) return;

    const suppItems = [
        { id: 'whey', name: 'Whey Protein', dose: '1 scoop' },
        { id: 'creatine', name: 'Creatine', dose: '5g' },
        { id: 'omega3', name: 'Omega-3', dose: '1 cap' },
        { id: 'vitd', name: 'Vitamin D', dose: '1 cap' }
    ];

    let html = '';
    suppItems.forEach(item => {
        const isChecked = supps[item.id] ? 'checked' : '';
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                <div>
                    <span style="display: block; font-weight: 500;">${item.name}</span>
                    <span class="text-secondary" style="font-size: 0.75rem;">${item.dose}</span>
                </div>
                <div>
                    <input type="checkbox" onchange="app.actions.toggleSupplement('${item.id}', this.checked)" ${isChecked} style="width: 20px; height: 20px; accent-color: var(--primary);">
                </div>
            </div>
        `;
    });

    list.innerHTML = html;
};

app.actions.toggleSupplement = function(suppId, isChecked) {
    const dayData = app.state.data.history[app.state.currentDate];
    dayData.supplements[suppId] = isChecked;
    app.utils.saveData();
    // Don't need full re-render for checkboxes to keep it smooth
};

app.ui.renderHabitsAndWater = function(dayData, targets) {
    // Water tracking
    const waterCurrentEl = document.getElementById('water-current');
    const waterTargetEl = document.getElementById('water-target-val');
    const waterBar = document.getElementById('water-bar');

    if (waterCurrentEl) waterCurrentEl.textContent = parseFloat(dayData.water).toFixed(2);
    if (waterTargetEl) waterTargetEl.textContent = targets.water;

    if (waterBar) {
        const pct = Math.min(100, (dayData.water / targets.water) * 100);
        waterBar.style.width = `${pct}%`;
        if (pct >= 100) waterBar.classList.replace('fill-accent', 'fill-success');
        else waterBar.classList.replace('fill-success', 'fill-accent');
    }

    // Habits tracking
    const list = document.getElementById('habit-list');
    if (!list) return;

    const habits = [
        { id: 'walk', name: '10k Steps / Walk', icon: '🚶‍♂️' },
        { id: 'nosugar', name: 'No Added Sugar', icon: '🚫' },
        { id: 'sleep', name: '7+ Hours Sleep', icon: '😴' }
    ];

    let html = '';
    habits.forEach(habit => {
        const isChecked = dayData.habits[habit.id] ? 'checked' : '';
        html += `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--bg-surface-2); border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <span>${habit.icon}</span>
                    <span style="font-weight: 500; font-size: 0.9rem;">${habit.name}</span>
                </div>
                <input type="checkbox" onchange="app.actions.toggleHabit('${habit.id}', this.checked)" ${isChecked} style="width: 20px; height: 20px; accent-color: var(--primary);">
            </div>
        `;
    });

    list.innerHTML = html;
};

app.actions.addWater = function(amount) {
    const dayData = app.state.data.history[app.state.currentDate];
    dayData.water = (parseFloat(dayData.water) + amount).toFixed(2);
    app.utils.saveData();
    app.ui.renderDashboard(); // Re-render to update score and progress bar
};

app.actions.toggleHabit = function(habitId, isChecked) {
    const dayData = app.state.data.history[app.state.currentDate];
    dayData.habits[habitId] = isChecked;
    app.utils.saveData();
    app.ui.renderHero(dayData, app.state.data.targets); // Update daily score silently
};

// === Charts Logic (Canvas) ===

app.ui.currentChartType = 'weight';

app.ui.setupChartTabs = function() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            app.ui.currentChartType = e.target.dataset.chart;
            app.ui.renderCharts();
        });
    });
};

app.ui.renderCharts = function() {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Handle retina displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();

    // Set actual size in memory (scaled to account for extra pixel density).
    canvas.width = rect.width * dpr;
    canvas.height = 200 * dpr;

    // Normalize coordinate system to use css pixels.
    ctx.scale(dpr, dpr);

    // Canvas dimensions for drawing
    const width = rect.width;
    const height = 200;

    ctx.clearRect(0, 0, width, height);

    // Extract last 7 days of data
    const history = app.state.data.history;
    const dates = Object.keys(history).sort();
    // Get up to 7 most recent dates
    const chartDates = dates.slice(Math.max(dates.length - 7, 0));

    if (chartDates.length === 0) return;

    const dataPoints = chartDates.map(date => {
        const d = history[date];
        let val = 0;
        if (app.ui.currentChartType === 'weight') val = parseFloat(d.weight || 0);
        else if (app.ui.currentChartType === 'calories') val = parseInt(d.macros.calories || 0);
        else if (app.ui.currentChartType === 'protein') val = parseInt(d.macros.protein || 0);
        return { date, val };
    });

    // Find min/max for scaling
    const values = dataPoints.map(dp => dp.val);
    const maxVal = Math.max(...values, 1);
    let minVal = Math.min(...values);

    // Add padding to min/max
    const padding = (maxVal - minVal) * 0.2;
    minVal = Math.max(0, minVal - padding);

    const range = maxVal - minVal || 1;

    // Drawing constants
    const paddingX = 30;
    const paddingY = 20;
    const drawWidth = width - (paddingX * 2);
    const drawHeight = height - (paddingY * 2);

    // Draw Grid Lines
    ctx.strokeStyle = '#2A3441';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= 3; i++) {
        const y = paddingY + (drawHeight / 3) * i;
        ctx.moveTo(paddingX, y);
        ctx.lineTo(width - paddingX, y);
    }
    ctx.stroke();

    // Calculate point coordinates
    const points = dataPoints.map((dp, i) => {
        const x = paddingX + (i / Math.max(1, dataPoints.length - 1)) * drawWidth;
        const y = paddingY + drawHeight - ((dp.val - minVal) / range) * drawHeight;
        return { x, y, val: dp.val, date: dp.date };
    });

    // Draw Line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
        // Smooth curve calculation
        const xc = (points[i].x + points[i-1].x) / 2;
        const yc = (points[i].y + points[i-1].y) / 2;
        ctx.quadraticCurveTo(points[i-1].x, points[i-1].y, xc, yc);
    }
    ctx.lineTo(points[points.length-1].x, points[points.length-1].y);

    ctx.strokeStyle = '#00F5D4'; // Electric Teal
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Gradient fill under the line
    const gradient = ctx.createLinearGradient(0, paddingY, 0, height - paddingY);
    gradient.addColorStop(0, 'rgba(0, 245, 212, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 245, 212, 0.0)');

    ctx.lineTo(points[points.length-1].x, height - paddingY);
    ctx.lineTo(points[0].x, height - paddingY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw Points
    points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#151A22'; // BG surface
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00F5D4';
        ctx.stroke();
    });

    // Draw Y-Axis Labels
    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(maxVal).toString(), paddingX - 8, paddingY);
    ctx.fillText(Math.round(minVal).toString(), paddingX - 8, height - paddingY);

    // Draw X-Axis Labels (Dates)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    points.forEach((p, i) => {
        // Show label for first, middle, and last to avoid crowding
        if (i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1) {
            const dateObj = new Date(p.date);
            const label = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            ctx.fillText(label, p.x, height - paddingY + 8);
        }
    });
};


// === Utility Functions ===
app.utils.escapeHTML = function(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g,
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
};

// === Initialize App ===
function initApp() {
    app.utils.loadData();
    app.ui.setupNavigationListeners();
    app.ui.setupPanelListeners();
    app.ui.setupChartTabs();

    // Setup window resize listener for responsive charts
    window.addEventListener('resize', () => {
        if (app.ui.resizeTimeout) clearTimeout(app.ui.resizeTimeout);
        app.ui.resizeTimeout = setTimeout(() => {
            app.ui.renderCharts();
        }, 100);
    });

    app.ui.updateDateDisplay();
    app.ui.renderDashboard();

    console.log("App Initialized. Current State:", app.state);
}

document.addEventListener('DOMContentLoaded', initApp);
